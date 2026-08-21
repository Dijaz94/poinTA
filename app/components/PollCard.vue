<script setup lang="ts">
import type { Announcement } from '~/types/announcements'

const props = defineProps<{
  announcement: Announcement
}>()

const emit = defineEmits<{
  voted: []
}>()

const toast = useToast()
const studentEmailCookie = useCookie<string>('student_email', { default: () => '' })
const email = ref(studentEmailCookie.value || '')

const checking = ref(false)
const checkStatus = ref<'idle' | 'authorized' | 'not_authorized' | 'already_voted' | 'expired'>('idle')
const selectedOptionId = ref('')
const votedOptionId = ref<string | null>(null)
const voting = ref(false)
const errorMessage = ref('')

const isPollExpired = computed(() => {
  if (!props.announcement.deadline) return false
  return new Date() > new Date(props.announcement.deadline)
})

// Auto-check if cookie email exists
onMounted(async () => {
  if (isPollExpired.value) {
    checkStatus.value = 'expired'
    return
  }
  if (email.value.trim()) {
    await verifyEmail()
  }
})

const verifyEmail = async () => {
  const cleanEmail = email.value.trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) {
    errorMessage.value = 'Por favor ingresa un correo válido.'
    return
  }

  errorMessage.value = ''
  checking.value = true

  try {
    const res = await $fetch<{
      authorized: boolean
      hasVoted: boolean
      votedOptionId: string | null
      isExpired: boolean
    }>(`/api/announcements/${props.announcement.id}/check`, {
      query: { email: cleanEmail },
    })

    studentEmailCookie.value = cleanEmail

    if (res.isExpired) {
      checkStatus.value = 'expired'
    } else if (res.hasVoted) {
      checkStatus.value = 'already_voted'
      votedOptionId.value = res.votedOptionId
    } else if (res.authorized) {
      checkStatus.value = 'authorized'
    } else {
      checkStatus.value = 'not_authorized'
    }
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage ?? 'No se pudo verificar el correo.'
  } finally {
    checking.value = false
  }
}

const resetEmail = () => {
  checkStatus.value = 'idle'
  selectedOptionId.value = ''
  errorMessage.value = ''
}

const submitVote = async () => {
  if (!selectedOptionId.value) {
    toast.add({ title: 'Selecciona una opción para votar.', color: 'warning' })
    return
  }

  voting.value = true
  try {
    await $fetch(`/api/announcements/${props.announcement.id}/vote`, {
      method: 'POST',
      body: {
        email: email.value.trim().toLowerCase(),
        optionId: selectedOptionId.value,
      },
    })

    votedOptionId.value = selectedOptionId.value
    checkStatus.value = 'already_voted'
    toast.add({
      title: '¡Voto registrado con éxito!',
      description: 'Tu respuesta ha sido guardada.',
      color: 'success',
    })
    emit('voted')
  } catch (e: any) {
    toast.add({
      title: e?.data?.statusMessage ?? 'No se pudo registrar tu voto.',
      color: 'error',
    })
  } finally {
    voting.value = false
  }
}
</script>

<template>
  <UCard
    :ui="{
      root: 'overflow-hidden border-l-4 border-l-indigo-500',
      header: 'pb-2 bg-muted/10',
      body: 'pt-4 space-y-4',
    }"
  >
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div class="flex items-center gap-2">
          <UBadge color="primary" variant="subtle" size="xs">
            <UIcon name="i-heroicons-chart-bar" class="size-3 mr-1" />
            Votación
          </UBadge>

          <UBadge
            v-if="announcement.deadline"
            :color="isPollExpired ? 'error' : 'warning'"
            variant="soft"
            size="xs"
          >
            <UIcon name="i-heroicons-clock" class="size-3 mr-1" />
            {{ isPollExpired ? 'Votación Cerrada' : `Cierra: ${formatDateTime(announcement.deadline)}` }}
          </UBadge>
        </div>

        <div class="flex items-center gap-1.5 text-xs text-muted whitespace-nowrap">
          <UIcon name="i-heroicons-clock" class="size-3.5" />
          {{ formatDateTime(announcement.createdAt) }}
        </div>
      </div>
    </template>

    <!-- Título y descripción -->
    <div>
      <h3 class="font-bold text-lg text-default">{{ announcement.title }}</h3>
      <p v-if="announcement.content" class="text-default text-sm whitespace-pre-wrap leading-relaxed mt-1">
        {{ announcement.content }}
      </p>
    </div>

    <!-- CASO 1: Votación cerrada / expirada -->
    <div v-if="isPollExpired" class="space-y-4 pt-2 border-t border-muted/30">
      <div class="flex items-center justify-between text-xs font-semibold text-muted">
        <span class="flex items-center gap-1 text-error">
          <UIcon name="i-heroicons-lock-closed" class="size-3.5" />
          Esta votación ha finalizado. Resultados definitivos:
        </span>
        <span class="text-primary font-bold">
          {{ announcement.totalVotes }} {{ announcement.totalVotes === 1 ? 'voto total' : 'votos totales' }}
        </span>
      </div>

      <!-- Resultados con barras de progreso -->
      <div class="space-y-2.5">
        <div
          v-for="opt in announcement.options"
          :key="opt.id"
          class="space-y-1 bg-muted/20 p-3 rounded-lg border border-muted/40"
        >
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-default">{{ opt.label }}</span>
            <span class="text-xs font-bold text-muted">
              {{ opt.voteCount }} {{ opt.voteCount === 1 ? 'voto' : 'votos' }}
              ({{ announcement.totalVotes > 0 ? Math.round((opt.voteCount / announcement.totalVotes) * 100) : 0 }}%)
            </span>
          </div>
          <div class="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
            <div
              class="bg-primary h-2 rounded-full transition-all duration-500"
              :style="{
                width: `${announcement.totalVotes > 0 ? Math.round((opt.voteCount / announcement.totalVotes) * 100) : 0}%`
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- CASO 2: Ya votó -->
    <div v-else-if="checkStatus === 'already_voted'" class="space-y-4 pt-2 border-t border-muted/30">
      <div class="flex items-center justify-between bg-primary/10 text-primary p-3 rounded-xl border border-primary/20 text-xs sm:text-sm">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="size-5 text-primary shrink-0" />
          <span>¡Ya registraste tu voto con <strong>{{ email }}</strong>!</span>
        </div>
        <UButton size="xs" variant="ghost" color="neutral" label="Cambiar correo" @click="resetEmail" />
      </div>

      <div class="flex items-center justify-between text-xs font-semibold text-muted pt-1">
        <span>Resultados actuales:</span>
        <span class="text-primary font-bold">
          {{ announcement.totalVotes }} {{ announcement.totalVotes === 1 ? 'voto total' : 'votos totales' }}
        </span>
      </div>

      <!-- Resultados con barras y highlight en la opción votada -->
      <div class="space-y-2.5">
        <div
          v-for="opt in announcement.options"
          :key="opt.id"
          class="space-y-1 p-3 rounded-lg border transition-all"
          :class="votedOptionId === opt.id ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/30' : 'bg-muted/20 border-muted/40'"
        >
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="font-medium text-default">{{ opt.label }}</span>
              <UBadge v-if="votedOptionId === opt.id" color="primary" variant="solid" size="xs">
                Tu voto
              </UBadge>
            </div>
            <span class="text-xs font-bold text-muted">
              {{ opt.voteCount }} {{ opt.voteCount === 1 ? 'voto' : 'votos' }}
              ({{ announcement.totalVotes > 0 ? Math.round((opt.voteCount / announcement.totalVotes) * 100) : 0 }}%)
            </span>
          </div>
          <div class="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
            <div
              class="h-2 rounded-full transition-all duration-500"
              :class="votedOptionId === opt.id ? 'bg-primary' : 'bg-primary/70'"
              :style="{
                width: `${announcement.totalVotes > 0 ? Math.round((opt.voteCount / announcement.totalVotes) * 100) : 0}%`
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- CASO 3: Correo no autorizado -->
    <div v-else-if="checkStatus === 'not_authorized'" class="space-y-3 pt-2 border-t border-muted/30">
      <div class="bg-error/10 border border-error/20 text-error p-3.5 rounded-xl text-sm flex items-start gap-2.5">
        <UIcon name="i-heroicons-exclamation-circle" class="size-5 shrink-0 mt-0.5" />
        <div class="space-y-1">
          <p class="font-semibold">No autorizado para votar</p>
          <p class="text-xs opacity-90">
            El correo <strong>{{ email }}</strong> no figura en la lista de estudiantes autorizados para esta votación.
          </p>
        </div>
      </div>
      <div class="flex justify-end">
        <UButton size="xs" variant="soft" color="neutral" label="Probar con otro correo" @click="resetEmail" />
      </div>
    </div>

    <!-- CASO 4: Autorizado y listo para votar -->
    <div v-else-if="checkStatus === 'authorized'" class="space-y-4 pt-2 border-t border-muted/30">
      <div class="flex items-center justify-between bg-muted/30 p-2.5 rounded-lg border border-muted/40 text-xs">
        <span class="text-muted">Votando como: <strong class="text-highlighted">{{ email }}</strong></span>
        <button class="text-primary hover:underline font-medium" @click="resetEmail">Cambiar</button>
      </div>

      <!-- Advertencia de voto definitivo -->
      <div class="bg-warning/10 border border-warning/30 text-warning p-3 rounded-xl text-xs flex items-start gap-2">
        <UIcon name="i-heroicons-exclamation-triangle" class="size-4 shrink-0 mt-0.5" />
        <span><strong>Atención:</strong> Tu voto es definitivo e irreversible. Una vez enviado no podrás cambiar tu elección.</span>
      </div>

      <!-- Selección de opciones -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider">Selecciona tu opción:</label>
        <div class="space-y-2">
          <div
            v-for="opt in announcement.options"
            :key="opt.id"
            class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-primary/50"
            :class="selectedOptionId === opt.id ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-muted/15 border-muted/40'"
            @click="selectedOptionId = opt.id"
          >
            <div
              class="w-4 h-4 rounded-full border flex items-center justify-center transition-colors"
              :class="selectedOptionId === opt.id ? 'border-primary bg-primary text-white' : 'border-muted'"
            >
              <div v-if="selectedOptionId === opt.id" class="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <span class="text-sm font-medium text-default flex-1">{{ opt.label }}</span>
          </div>
        </div>
      </div>

      <div class="pt-2 flex items-center justify-end gap-3">
        <UButton
          color="primary"
          icon="i-heroicons-check"
          label="Confirmar y Emitir Voto"
          :loading="voting"
          :disabled="!selectedOptionId"
          @click="submitVote"
        />
      </div>
    </div>

    <!-- CASO 5: Pedir correo (Estado inicial / Idle) -->
    <div v-else class="space-y-4 pt-2 border-t border-muted/30">
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider">Opciones disponibles:</label>
        <div class="space-y-1.5">
          <div
            v-for="opt in announcement.options"
            :key="opt.id"
            class="p-2.5 rounded-lg bg-muted/20 border border-muted/30 text-sm font-medium text-muted flex items-center gap-2"
          >
            <UIcon name="i-heroicons-radio" class="size-4 text-muted/60" />
            <span>{{ opt.label }}</span>
          </div>
        </div>
      </div>

      <!-- Formulario para ingresar correo -->
      <div class="bg-muted/20 p-4 rounded-xl border border-muted/40 space-y-3">
        <div>
          <label class="block text-sm font-semibold text-highlighted mb-1">Ingresa tu correo institucional para votar</label>
          <p class="text-xs text-muted">Verificaremos que estés en la lista autorizada para habilitar tu voto.</p>
        </div>

        <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="verifyEmail">
          <UInput
            v-model="email"
            placeholder="ej: tu.correo@universidad.cl"
            class="flex-1"
            type="email"
            icon="i-heroicons-envelope"
          />
          <UButton
            type="submit"
            color="primary"
            variant="solid"
            label="Participar"
            icon="i-heroicons-arrow-right"
            :loading="checking"
          />
        </form>

        <p v-if="errorMessage" class="text-xs text-error font-medium">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </UCard>
</template>
