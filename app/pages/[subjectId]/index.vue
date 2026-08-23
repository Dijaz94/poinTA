<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { Announcement } from '~/types/announcements'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)
const toast = useToast()
const studentEmailCookie = useCookie<string>('student_email', { default: () => '' })

const { data: announcements, status, error, refresh } = await useFetch('/api/announcements', {
  query: { subjectId: subjectId.value },
  transform: (data) => data as Announcement[],
})

// ─── Lógica Inlined de Encuestas / Votaciones (Polls) ───
interface PollState {
  email: string
  checking: boolean
  checkStatus: 'idle' | 'authorized' | 'not_authorized' | 'already_voted' | 'expired'
  selectedOptionId: string
  votedOptionId: string | null
  voting: boolean
  errorMessage: string
}

const pollStates = reactive<Record<string, PollState>>({})

function getPollState(pollId: string): PollState {
  if (!pollStates[pollId]) {
    pollStates[pollId] = {
      email: studentEmailCookie.value || '',
      checking: false,
      checkStatus: 'idle',
      selectedOptionId: '',
      votedOptionId: null,
      voting: false,
      errorMessage: '',
    }
  }
  return pollStates[pollId]
}

const isPollExpired = (deadlineVal: string | null | undefined) => {
  if (!deadlineVal) return false
  return new Date() > new Date(deadlineVal)
}

async function verifyEmail(announcement: Announcement) {
  const state = getPollState(announcement.id)
  const cleanEmail = state.email.trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) {
    state.errorMessage = 'Por favor ingresa un correo válido.'
    return
  }

  state.errorMessage = ''
  state.checking = true

  try {
    const res = await $fetch<{
      authorized: boolean
      hasVoted: boolean
      votedOptionId: string | null
      isExpired: boolean
    }>(`/api/announcements/${announcement.id}/check`, {
      query: { email: cleanEmail },
    })

    studentEmailCookie.value = cleanEmail

    if (res.isExpired) {
      state.checkStatus = 'expired'
    } else if (res.hasVoted) {
      state.checkStatus = 'already_voted'
      state.votedOptionId = res.votedOptionId
    } else if (res.authorized) {
      state.checkStatus = 'authorized'
    } else {
      state.checkStatus = 'not_authorized'
    }
  } catch (e: any) {
    state.errorMessage = e?.data?.statusMessage ?? 'No se pudo verificar el correo.'
  } finally {
    state.checking = false
  }
}

function resetEmail(announcementId: string) {
  const state = getPollState(announcementId)
  state.checkStatus = 'idle'
  state.selectedOptionId = ''
  state.errorMessage = ''
}

async function submitVote(announcement: Announcement) {
  const state = getPollState(announcement.id)
  if (!state.selectedOptionId) {
    toast.add({ title: 'Selecciona una opción para votar.', color: 'warning' })
    return
  }

  state.voting = true
  try {
    await $fetch(`/api/announcements/${announcement.id}/vote`, {
      method: 'POST',
      body: {
        email: state.email.trim().toLowerCase(),
        optionId: state.selectedOptionId,
      },
    })

    state.votedOptionId = state.selectedOptionId
    state.checkStatus = 'already_voted'
    toast.add({
      title: '¡Voto registrado con éxito!',
      description: 'Tu respuesta ha sido guardada.',
      color: 'success',
    })
    await refresh()
  } catch (e: any) {
    toast.add({
      title: e?.data?.statusMessage ?? 'No se pudo registrar tu voto.',
      color: 'error',
    })
  } finally {
    state.voting = false
  }
}

// Check auto-verification for polls when mounted
onMounted(async () => {
  if (!announcements.value) return
  for (const ann of announcements.value) {
    if (ann.type === 'POLL') {
      const state = getPollState(ann.id)
      if (isPollExpired(ann.deadline)) {
        state.checkStatus = 'expired'
      } else if (state.email.trim()) {
        await verifyEmail(ann)
      }
    }
  }
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-highlighted">Anuncios y Votaciones</h2>
        <p class="text-sm text-muted">Avisos importantes y consultas activas del equipo docente</p>
      </div>
    </div>

    <!-- Error state -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="No se pudieron cargar los anuncios."
      class="mb-6"
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar la plataforma.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <!-- Loading state -->
    <div v-else-if="status === 'pending'" class="space-y-4">
      <UCard v-for="i in 2" :key="i" class="w-full">
        <div class="space-y-4">
          <USkeleton class="h-6 w-1/3" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-5/6" />
        </div>
      </UCard>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="announcements?.length === 0"
      class="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-muted"
    >
      <UIcon name="i-lucide-megaphone" class="text-4xl text-muted mb-4 mx-auto" />
      <h3 class="text-lg font-semibold text-highlighted mb-2">No hay anuncios ni votaciones</h3>
      <p class="text-muted max-w-sm mx-auto">
        Aún no se han publicado avisos para esta asignatura. Vuelve a revisar más tarde.
      </p>
    </div>

    <!-- Lista de Anuncios -->
    <div v-else class="space-y-4">
      <template v-for="announcement in announcements" :key="announcement.id">
        <!-- Comunicado público -->
        <AnnouncementCard
          v-if="announcement.type === 'COMMUNICATION'"
          :announcement="announcement"
        />

        <!-- Votación pública (código inlined) -->
        <UCard
          v-else-if="announcement.type === 'POLL'"
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
                  <UIcon name="i-lucide-chart-bar" class="size-3 mr-1" />
                  Votación
                </UBadge>

                <UBadge
                  v-if="announcement.deadline"
                  :color="isPollExpired(announcement.deadline) ? 'error' : 'warning'"
                  variant="soft"
                  size="xs"
                >
                  <UIcon name="i-lucide-clock" class="size-3 mr-1" />
                  {{ isPollExpired(announcement.deadline) ? 'Votación Cerrada' : `Cierra: ${formatDateTime(announcement.deadline)}` }}
                </UBadge>
              </div>

              <div class="flex items-center gap-1.5 text-xs text-muted whitespace-nowrap">
                <UIcon name="i-lucide-clock" class="size-3.5" />
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

          <!-- Caso 1: Votación expirada -->
          <div v-if="isPollExpired(announcement.deadline)" class="space-y-4 pt-2 border-t border-muted/30">
            <div class="flex items-center justify-between text-xs font-semibold text-muted">
              <span class="flex items-center gap-1 text-error">
                <UIcon name="i-lucide-lock" class="size-3.5" />
                Esta votación ha finalizado. Resultados definitivos:
              </span>
              <span class="text-primary font-bold">
                {{ announcement.totalVotes }} {{ announcement.totalVotes === 1 ? 'voto total' : 'votos totales' }}
              </span>
            </div>

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
                    ({{ (announcement.totalVotes ?? 0) > 0 ? Math.round((opt.voteCount / (announcement.totalVotes || 1)) * 100) : 0 }}%)
                  </span>
                </div>
                <div class="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                  <div
                    class="bg-primary h-2 rounded-full transition-all duration-500"
                    :style="{
                      width: `${(announcement.totalVotes ?? 0) > 0 ? Math.round((opt.voteCount / (announcement.totalVotes || 1)) * 100) : 0}%`
                    }"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Caso 2: Ya votó -->
          <div v-else-if="getPollState(announcement.id).checkStatus === 'already_voted'" class="space-y-4 pt-2 border-t border-muted/30">
            <div class="flex items-center justify-between bg-primary/10 text-primary p-3 rounded-xl border border-primary/20 text-xs sm:text-sm">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-circle-check" class="size-5 text-primary shrink-0" />
                <span>¡Ya registraste tu voto con <strong>{{ getPollState(announcement.id).email }}</strong>!</span>
              </div>
              <UButton size="xs" variant="ghost" color="neutral" label="Cambiar correo" @click="resetEmail(announcement.id)" />
            </div>

            <div class="flex items-center justify-between text-xs font-semibold text-muted pt-1">
              <span>Resultados actuales:</span>
              <span class="text-primary font-bold">
                {{ announcement.totalVotes }} {{ announcement.totalVotes === 1 ? 'voto total' : 'votos totales' }}
              </span>
            </div>

            <div class="space-y-2.5">
              <div
                v-for="opt in announcement.options"
                :key="opt.id"
                class="space-y-1 p-3 rounded-lg border transition-all"
                :class="getPollState(announcement.id).votedOptionId === opt.id ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/30' : 'bg-muted/20 border-muted/40'"
              >
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-default">{{ opt.label }}</span>
                    <UBadge v-if="getPollState(announcement.id).votedOptionId === opt.id" color="primary" variant="solid" size="xs">
                      Tu voto
                    </UBadge>
                  </div>
                  <span class="text-xs font-bold text-muted">
                    {{ opt.voteCount }} {{ opt.voteCount === 1 ? 'voto' : 'votos' }}
                    ({{ (announcement.totalVotes ?? 0) > 0 ? Math.round((opt.voteCount / (announcement.totalVotes || 1)) * 100) : 0 }}%)
                  </span>
                </div>
                <div class="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-2 rounded-full transition-all duration-500"
                    :class="getPollState(announcement.id).votedOptionId === opt.id ? 'bg-primary' : 'bg-primary/70'"
                    :style="{
                      width: `${(announcement.totalVotes ?? 0) > 0 ? Math.round((opt.voteCount / (announcement.totalVotes || 1)) * 100) : 0}%`
                    }"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Caso 3: Correo no autorizado -->
          <div v-else-if="getPollState(announcement.id).checkStatus === 'not_authorized'" class="space-y-3 pt-2 border-t border-muted/30">
            <div class="bg-error/10 border border-error/20 text-error p-3.5 rounded-xl text-sm flex items-start gap-2.5">
              <UIcon name="i-lucide-circle-alert" class="size-5 shrink-0 mt-0.5" />
              <div class="space-y-1">
                <p class="font-semibold">No autorizado para votar</p>
                <p class="text-xs opacity-90">
                  El correo <strong>{{ getPollState(announcement.id).email }}</strong> no figura en la lista de estudiantes autorizados para esta votación.
                </p>
              </div>
            </div>
            <div class="flex justify-end">
              <UButton size="xs" variant="soft" color="neutral" label="Probar con otro correo" @click="resetEmail(announcement.id)" />
            </div>
          </div>

          <!-- Caso 4: Autorizado y listo para votar -->
          <div v-else-if="getPollState(announcement.id).checkStatus === 'authorized'" class="space-y-4 pt-2 border-t border-muted/30">
            <div class="flex items-center justify-between bg-muted/30 p-2.5 rounded-lg border border-muted/40 text-xs">
              <span class="text-muted">Votando como: <strong class="text-highlighted">{{ getPollState(announcement.id).email }}</strong></span>
              <button class="text-primary hover:underline font-medium" @click="resetEmail(announcement.id)">Cambiar</button>
            </div>

            <div class="bg-warning/10 border border-warning/30 text-warning p-3 rounded-xl text-xs flex items-start gap-2">
              <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0 mt-0.5" />
              <span><strong>Atención:</strong> Tu voto es definitivo e irreversible. Una vez enviado no podrás cambiar tu elección.</span>
            </div>

            <div class="space-y-2">
              <label class="block text-xs font-semibold text-muted uppercase tracking-wider">Selecciona tu opción:</label>
              <div class="space-y-2">
                <div
                  v-for="opt in announcement.options"
                  :key="opt.id"
                  class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-primary/50"
                  :class="getPollState(announcement.id).selectedOptionId === opt.id ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-muted/15 border-muted/40'"
                  @click="getPollState(announcement.id).selectedOptionId = opt.id"
                >
                  <div
                    class="w-4 h-4 rounded-full border flex items-center justify-center transition-colors"
                    :class="getPollState(announcement.id).selectedOptionId === opt.id ? 'border-primary bg-primary text-white' : 'border-muted'"
                  >
                    <div v-if="getPollState(announcement.id).selectedOptionId === opt.id" class="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span class="text-sm font-medium text-default flex-1">{{ opt.label }}</span>
                </div>
              </div>
            </div>

            <div class="pt-2 flex items-center justify-end gap-3">
              <UButton
                color="primary"
                icon="i-lucide-check"
                label="Confirmar y Emitir Voto"
                :loading="getPollState(announcement.id).voting"
                :disabled="!getPollState(announcement.id).selectedOptionId"
                @click="submitVote(announcement)"
              />
            </div>
          </div>

          <!-- Caso 5: Pedir correo (Idle) -->
          <div v-else class="space-y-4 pt-2 border-t border-muted/30">
            <div class="space-y-2">
              <label class="block text-xs font-semibold text-muted uppercase tracking-wider">Opciones disponibles:</label>
              <div class="space-y-1.5">
                <div
                  v-for="opt in announcement.options"
                  :key="opt.id"
                  class="p-2.5 rounded-lg bg-muted/20 border border-muted/30 text-sm font-medium text-muted flex items-center gap-2"
                >
                  <UIcon name="i-lucide-radio" class="size-4 text-muted/60" />
                  <span>{{ opt.label }}</span>
                </div>
              </div>
            </div>

            <div class="bg-muted/20 p-4 rounded-xl border border-muted/40 space-y-3">
              <div>
                <label class="block text-sm font-semibold text-highlighted mb-1">Ingresa tu correo institucional para votar</label>
                <p class="text-xs text-muted">Verificaremos que estés en la lista autorizada para habilitar tu voto.</p>
              </div>

              <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="verifyEmail(announcement)">
                <UInput
                  v-model="getPollState(announcement.id).email"
                  placeholder="ej: tu.correo@universidad.cl"
                  class="flex-1"
                  type="email"
                  icon="i-lucide-mail"
                />
                <UButton
                  type="submit"
                  color="primary"
                  variant="solid"
                  label="Participar"
                  icon="i-lucide-arrow-right"
                  :loading="getPollState(announcement.id).checking"
                />
              </form>

              <p v-if="getPollState(announcement.id).errorMessage" class="text-xs text-error font-medium">
                {{ getPollState(announcement.id).errorMessage }}
              </p>
            </div>
          </div>
        </UCard>
      </template>
    </div>
  </div>
</template>