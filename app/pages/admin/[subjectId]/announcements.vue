<script setup lang="ts">
import type { Announcement } from '~/types/announcements'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)
const toast = useToast()

const { data: announcements, status, error, refresh } = await useFetch<Announcement[]>('/api/announcements', {
  query: { subjectId },
})

const announcementType = ref<'COMMUNICATION' | 'POLL'>('COMMUNICATION')
const title = ref('')
const content = ref('')
const deadline = ref('')
const options = ref<string[]>(['', ''])
const authorizedEmailsText = ref('')
const submitting = ref(false)
const deletingId = ref('')

// Add option
const addOption = () => {
  if (options.value.length < 10) {
    options.value.push('')
  }
}

// Remove option
const removeOption = (index: number) => {
  if (options.value.length > 2) {
    options.value.splice(index, 1)
  }
}

// Parse emails from text
const parsedEmails = computed(() => {
  if (!authorizedEmailsText.value.trim()) return []
  return authorizedEmailsText.value
    .split(/[\n,;]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0 && e.includes('@'))
})

const submit = async () => {
  if (!title.value.trim()) {
    toast.add({ title: 'Ingresa un título o pregunta.', color: 'warning' })
    return
  }

  if (announcementType.value === 'COMMUNICATION') {
    if (!content.value.trim()) {
      toast.add({ title: 'Ingresa el contenido del comunicado.', color: 'warning' })
      return
    }
  } else {
    // POLL validation
    const validOptions = options.value.map(o => o.trim()).filter(Boolean)
    if (validOptions.length < 2) {
      toast.add({ title: 'Debes definir al menos 2 opciones para la votación.', color: 'warning' })
      return
    }
    if (parsedEmails.value.length === 0) {
      toast.add({ title: 'Ingresa al menos un correo de estudiante autorizado.', color: 'warning' })
      return
    }
  }

  submitting.value = true
  try {
    const payload: any = {
      title: title.value.trim(),
      content: content.value.trim(),
      type: announcementType.value,
      subjectId: subjectId.value,
    }

    if (announcementType.value === 'POLL') {
      payload.options = options.value.map(o => o.trim()).filter(Boolean)
      payload.authorizedEmails = parsedEmails.value
      if (deadline.value) {
        payload.deadline = new Date(deadline.value).toISOString()
      }
    }

    await $fetch('/api/admin/announcements', {
      method: 'POST',
      body: payload,
    })

    title.value = ''
    content.value = ''
    deadline.value = ''
    options.value = ['', '']
    authorizedEmailsText.value = ''
    toast.add({
      title: announcementType.value === 'POLL' ? 'Votación publicada con éxito.' : 'Comunicado publicado.',
      color: 'success',
    })
    await refresh()
  } catch (e: any) {
    toast.add({
      title: e?.data?.statusMessage ?? 'No se pudo publicar el anuncio.',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

const remove = async (id: string) => {
  deletingId.value = id
  try {
    await $fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Anuncio eliminado.', color: 'success' })
    await refresh()
  } catch (e: any) {
    toast.add({
      title: e?.data?.statusMessage ?? 'No se pudo eliminar el anuncio.',
      color: 'error',
    })
  } finally {
    deletingId.value = ''
  }
}

const isExpired = (deadlineVal: string | null) => {
  if (!deadlineVal) return false
  return new Date() > new Date(deadlineVal)
}
</script>

<template>
  <div class="space-y-8">
    <!-- Crear anuncio / votación -->
    <UCard>
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-highlighted">
              {{ announcementType === 'POLL' ? 'Crear Votación' : 'Publicar Comunicado' }}
            </h2>
            <p class="text-xs text-muted">
              {{ announcementType === 'POLL' ? 'Crea una encuesta con opciones y lista de estudiantes autorizados' : 'Publica avisos informativos para el curso' }}
            </p>
          </div>

          <!-- Selector de Tipo: Comunicado o Votación -->
          <div class="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-muted/50 self-start sm:self-auto">
            <UButton
              size="xs"
              :variant="announcementType === 'COMMUNICATION' ? 'solid' : 'ghost'"
              :color="announcementType === 'COMMUNICATION' ? 'primary' : 'neutral'"
              icon="i-lucide-megaphone"
              label="Comunicado"
              @click="announcementType = 'COMMUNICATION'"
            />
            <UButton
              size="xs"
              :variant="announcementType === 'POLL' ? 'solid' : 'ghost'"
              :color="announcementType === 'POLL' ? 'primary' : 'neutral'"
              icon="i-lucide-chart-bar"
              label="Votación"
              @click="announcementType = 'POLL'"
            />
          </div>
        </div>
      </template>

      <form class="space-y-5" @submit.prevent="submit">
        <!-- Título / Pregunta -->
        <UFormField :label="announcementType === 'POLL' ? 'Pregunta o Título de la votación' : 'Título'" name="title" required>
          <UInput
            v-model="title"
            :placeholder="announcementType === 'POLL' ? 'Ej: ¿Qué horario prefieren para la ayudantía recuperativa?' : 'Título del anuncio'"
            class="w-full"
          />
        </UFormField>

        <!-- Descripción / Contenido -->
        <UFormField
          :label="announcementType === 'POLL' ? 'Descripción o contexto adicional (opcional)' : 'Contenido'"
          name="content"
          :required="announcementType === 'COMMUNICATION'"
        >
          <UTextarea
            v-model="content"
            :placeholder="announcementType === 'POLL' ? 'Detalles sobre la votación o instrucciones para los alumnos...' : 'Escribe el anuncio...'"
            class="w-full"
            :rows="announcementType === 'POLL' ? 3 : 5"
          />
        </UFormField>

        <!-- Campos específicos de Votación -->
        <div v-if="announcementType === 'POLL'" class="space-y-6 pt-2 border-t border-muted/30">
          <!-- Opciones de voto -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-semibold text-highlighted">Opciones de votación</label>
              <span class="text-xs text-muted">Mínimo 2, máximo 10</span>
            </div>

            <div class="space-y-2.5">
              <div
                v-for="(_, index) in options"
                :key="index"
                class="flex items-center gap-2"
              >
                <div class="w-7 text-xs font-bold text-muted flex items-center justify-center">
                  {{ index + 1 }}.
                </div>
                <UInput
                  v-model="options[index]"
                  :placeholder="`Opción ${index + 1}`"
                  class="flex-1"
                />
                <UButton
                  v-if="options.length > 2"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-x"
                  size="sm"
                  aria-label="Eliminar opción"
                  @click="removeOption(index)"
                />
              </div>
            </div>

            <div class="pt-1">
              <UButton
                v-if="options.length < 10"
                size="xs"
                variant="subtle"
                color="neutral"
                icon="i-lucide-plus"
                label="Agregar opción"
                @click="addOption"
              />
            </div>
          </div>

          <!-- Correos autorizados -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-semibold text-highlighted">Estudiantes autorizados para votar</label>
              <UBadge v-if="parsedEmails.length > 0" color="primary" variant="subtle" size="xs">
                {{ parsedEmails.length }} {{ parsedEmails.length === 1 ? 'correo detectado' : 'correos detectados' }}
              </UBadge>
            </div>
            <p class="text-xs text-muted">
              Pega la lista de correos institucionales de los estudiantes autorizados (un correo por línea o separados por coma).
            </p>
            <UTextarea
              v-model="authorizedEmailsText"
              placeholder="estudiante1@mail.cl&#10;estudiante2@mail.cl"
              class="w-full font-mono text-xs"
              :rows="4"
            />
          </div>

          <!-- Fecha límite opcional -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-highlighted">Fecha límite de votación (opcional)</label>
            <p class="text-xs text-muted">
              Pasada esta fecha, la encuesta se cerrará automáticamente para nuevos votos.
            </p>
            <UInput
              v-model="deadline"
              type="datetime-local"
              class="w-full sm:w-72"
            />
          </div>
        </div>

        <div class="pt-2">
          <UButton
            type="submit"
            color="primary"
            :icon="announcementType === 'POLL' ? 'i-lucide-chart-bar' : 'i-lucide-megaphone'"
            :label="announcementType === 'POLL' ? 'Publicar Votación' : 'Publicar Anuncio'"
            :loading="submitting"
          />
        </div>
      </form>
    </UCard>

    <!-- Lista de anuncios publicados -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-bold text-highlighted">Publicaciones anteriores</h3>
      </div>

      <div v-if="status === 'pending'" class="space-y-4">
        <UCard v-for="i in 2" :key="i" class="w-full">
          <div class="space-y-4">
            <USkeleton class="h-6 w-1/3" />
            <USkeleton class="h-4 w-full" />
          </div>
        </UCard>
      </div>

      <div
        v-else-if="announcements?.length === 0"
        class="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-muted"
      >
        <p class="text-muted">Aún no hay anuncios o votaciones publicadas para esta asignatura.</p>
      </div>

      <div v-else class="space-y-4">
        <UCard
          v-for="announcement in announcements"
          :key="announcement.id"
          :ui="{ root: announcement.type === 'POLL' ? 'border-l-4 border-l-indigo-500' : 'border-l-4 border-l-primary' }"
        >
          <div class="space-y-4">
            <!-- Header del item -->
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-1.5">
                  <UBadge
                    :color="announcement.type === 'POLL' ? 'primary' : 'neutral'"
                    variant="subtle"
                    size="xs"
                  >
                    <UIcon :name="announcement.type === 'POLL' ? 'i-lucide-chart-bar' : 'i-lucide-megaphone'" class="size-3 mr-1" />
                    {{ announcement.type === 'POLL' ? 'Votación' : 'Comunicado' }}
                  </UBadge>

                  <UBadge
                    v-if="announcement.type === 'POLL' && announcement.deadline"
                    :color="isExpired(announcement.deadline) ? 'error' : 'warning'"
                    variant="soft"
                    size="xs"
                  >
                    <UIcon name="i-lucide-clock" class="size-3 mr-1" />
                    {{ isExpired(announcement.deadline) ? 'Votación Cerrada' : `Cierra: ${formatDateTime(announcement.deadline)}` }}
                  </UBadge>

                  <span class="text-xs text-muted whitespace-nowrap">
                    {{ formatDateTime(announcement.createdAt) }}
                  </span>
                </div>

                <h3 class="font-bold text-lg text-default">{{ announcement.title }}</h3>
                <p v-if="announcement.content" class="text-default text-sm whitespace-pre-wrap leading-relaxed mt-1">
                  {{ announcement.content }}
                </p>
              </div>

              <UButton
                color="error"
                variant="soft"
                icon="i-lucide-trash"
                size="sm"
                :loading="deletingId === announcement.id"
                aria-label="Eliminar publicación"
                @click="remove(announcement.id)"
              />
            </div>

            <!-- Resultados en tiempo real de la votación (solo para POLL) -->
            <div v-if="announcement.type === 'POLL' && announcement.options?.length" class="space-y-3 pt-3 border-t border-muted/30">
              <div class="flex items-center justify-between text-xs font-semibold text-muted">
                <span>Resultados de la votación</span>
                <span class="text-primary font-bold">
                  {{ announcement.totalVotes ?? 0 }} {{ (announcement.totalVotes ?? 0) === 1 ? 'voto total' : 'votos totales' }}
                </span>
              </div>

              <div class="space-y-2.5">
                <div
                  v-for="opt in announcement.options"
                  :key="opt.id"
                  class="space-y-1 bg-muted/20 p-2.5 rounded-lg border border-muted/40"
                >
                  <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-default">{{ opt.label }}</span>
                    <span class="text-xs font-bold text-muted">
                      {{ opt.voteCount }} {{ opt.voteCount === 1 ? 'voto' : 'votos' }}
                      ({{ (announcement.totalVotes ?? 0) > 0 ? Math.round((opt.voteCount / (announcement.totalVotes || 1)) * 100) : 0 }}%)
                    </span>
                  </div>

                  <!-- Barra de progreso -->
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
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>