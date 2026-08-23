<script setup lang="ts">
import { ref, computed } from 'vue'

defineProps<{
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: {
    title: string
    content: string
    type: 'COMMUNICATION' | 'POLL'
    options?: string[]
    authorizedEmails?: string[]
    deadline?: string
  }]
}>()

const toast = useToast()

const announcementType = ref<'COMMUNICATION' | 'POLL'>('COMMUNICATION')
const title = ref('')
const content = ref('')
const deadline = ref('')
const options = ref<string[]>(['', ''])
const authorizedEmailsText = ref('')

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

const handleSubmit = () => {
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

  const payload: any = {
    title: title.value.trim(),
    content: content.value.trim(),
    type: announcementType.value,
  }

  if (announcementType.value === 'POLL') {
    payload.options = options.value.map(o => o.trim()).filter(Boolean)
    payload.authorizedEmails = parsedEmails.value
    if (deadline.value) {
      payload.deadline = new Date(deadline.value).toISOString()
    }
  }

  emit('submit', payload)
}

const resetForm = () => {
  title.value = ''
  content.value = ''
  deadline.value = ''
  options.value = ['', '']
  authorizedEmailsText.value = ''
}

defineExpose({
  resetForm,
})
</script>

<template>
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

    <form class="space-y-5" @submit.prevent="handleSubmit">
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
</template>
