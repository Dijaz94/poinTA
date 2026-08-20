<script setup lang="ts">
import type { Session } from '~/types/sessions'
import type { SessionForm } from '~/types/sessionForm'

const props = defineProps<{
  subjectId: string
}>()

const emit = defineEmits<{
  saved: []
}>()

const toast = useToast()

const isOpen = ref(false)
const saving = ref(false)

const form = reactive<SessionForm>({
  id: null,
  title: '',
  isRecurring: true,
  dayOfWeek: 'MONDAY',
  date: '',
  startTime: '14:00',
  endTime: '15:30',
  location: '',
})

function openNew() {
  form.id = null
  form.title = ''
  form.isRecurring = true
  form.dayOfWeek = 'MONDAY'
  form.date = ''
  form.startTime = '14:00'
  form.endTime = '15:30'
  form.location = ''
  isOpen.value = true
}

function openEdit(s: Session) {
  form.id = s.id
  form.title = s.title
  form.isRecurring = s.isRecurring
  form.dayOfWeek = s.dayOfWeek ?? 'MONDAY'
  form.date = s.date ? (new Date(s.date).toISOString().split('T')[0] ?? '') : ''
  form.startTime = s.startTime
  form.endTime = s.endTime
  form.location = s.location ?? ''
  isOpen.value = true
}

async function saveSession() {
  if (!form.title.trim()) {
    toast.add({ title: 'El título es obligatorio.', color: 'warning' })
    return
  }
  if (!form.startTime || !form.endTime) {
    toast.add({ title: 'Completa las horas de inicio y término.', color: 'warning' })
    return
  }
  if (!form.isRecurring && !form.date) {
    toast.add({ title: 'Para sesiones extraordinarias, indica la fecha.', color: 'warning' })
    return
  }

  saving.value = true
  try {
    if (form.id) {
      await $fetch(`/api/admin/schedule/${form.id}`, {
        method: 'PUT',
        body: { ...form, date: form.date || null },
      })
      toast.add({ title: 'Sesión actualizada.', color: 'success' })
    } else {
      await $fetch('/api/admin/schedule', {
        method: 'POST',
        body: {
          title: form.title,
          isRecurring: form.isRecurring,
          dayOfWeek: form.isRecurring ? form.dayOfWeek : null,
          date: !form.isRecurring ? form.date : null,
          startTime: form.startTime,
          endTime: form.endTime,
          location: form.location,
          subjectId: props.subjectId,
        },
      })
      toast.add({ title: 'Sesión creada.', color: 'success' })
    }
    isOpen.value = false
    emit('saved')
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage ?? 'No se pudo guardar la sesión.', color: 'error' })
  } finally {
    saving.value = false
  }
}

defineExpose({
  openNew,
  openEdit,
})
</script>

<template>
  <UModal v-model:open="isOpen" :title="form.id ? 'Editar sesión' : 'Nueva sesión'" :ui="{ content: 'max-w-lg' }">
    <template #body>
      <form class="space-y-5 p-1" @submit.prevent="saveSession">
        <UFormField label="Título" name="title">
          <UInput v-model="form.title" placeholder="Ej: Ayudantía Sección 1" class="w-full" />
        </UFormField>

        <UFormField label="Tipo de sesión" name="isRecurring">
          <div class="flex gap-4">
            <URadioGroup v-model="form.isRecurring" :items="[
              { label: 'Recurrente (semanal)', value: true },
              { label: 'Extraordinaria (fecha puntual)', value: false },
            ]" />
          </div>
        </UFormField>

        <UFormField v-if="form.isRecurring" label="Día de la semana" name="dayOfWeek">
          <USelect
            v-model="form.dayOfWeek"
            :items="DAYS.map(d => ({ label: d.label, value: d.value as string }))"
            class="w-full"
          />
        </UFormField>

        <UFormField v-else label="Fecha" name="date">
          <UInput v-model="form.date" type="date" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Hora inicio" name="startTime">
            <UInput v-model="form.startTime" type="time" class="w-full" />
          </UFormField>
          <UFormField label="Hora término" name="endTime">
            <UInput v-model="form.endTime" type="time" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Ubicación (opcional)" name="location">
          <UInput v-model="form.location" placeholder="Ej: Sala A-102" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-3 pt-2">
          <UButton color="neutral" variant="ghost" label="Cancelar" @click="isOpen = false" />
          <UButton
            type="submit"
            color="primary"
            :label="form.id ? 'Guardar cambios' : 'Crear sesión'"
            :loading="saving"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
