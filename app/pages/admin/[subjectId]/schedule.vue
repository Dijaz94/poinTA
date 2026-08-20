<script setup lang="ts">
import { useSortable } from '@vueuse/integrations'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)
const toast = useToast()

// ─── Datos ───
const { data: sessions, status, error, refresh } = await useFetch('/api/schedule', {
  query: { subjectId },
})

const dayColumnRefs = ref<Record<string, HTMLElement | null>>({})
const columns = ref<Record<string, Session[]>>({
  MONDAY: [], TUESDAY: [], WEDNESDAY: [],
  THURSDAY: [], FRIDAY: [], SATURDAY: [], SUNDAY: [],
})

const extraordinarySessions = computed(() =>
  (sessions.value ?? []).filter((s: any) => !s.isRecurring),
)

function rebuildColumns() {
  const map: Record<string, Session[]> = {}
  for (const d of DAYS) map[d.value] = []
  for (const s of (sessions.value ?? []) as any[]) {
    if (s.isRecurring && s.dayOfWeek && map[s.dayOfWeek]) {
      map[s.dayOfWeek].push(s)
    }
  }
  columns.value = map
}

watch(sessions, rebuildColumns, { immediate: true })

// ─── Sortable ───
function onDrop(evt: any, fromDay: string) {
  const id = (evt.item as HTMLElement).dataset.id
  const toDay = (evt.to as HTMLElement)?.dataset.day
  if (!id || !toDay) return
  moveSession(id, fromDay, toDay)
}

function moveSession(id: string, fromDay: string, toDay: string) {
  const fromArr = columns.value[fromDay]
  if (!fromArr) return
  const idx = fromArr.findIndex((s) => s.id === id)
  if (idx === -1) return

  const [moved] = fromArr.splice(idx, 1)
  columns.value[toDay].push(moved)

  if (fromDay !== toDay) {
    moved.dayOfWeek = toDay
    updateDayOfWeek(id, toDay)
  }
}

async function updateDayOfWeek(id: string, day: string) {
  try {
    await $fetch('/api/schedule', {
      method: 'PUT',
      body: { id, dayOfWeek: day },
    })
    toast.add({ title: `Sesión movida a ${dayLabel(day)}.`, color: 'success' })
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage ?? 'No se pudo actualizar el horario.', color: 'error' })
    await refresh()
  }
}

onMounted(async () => {
  for (const d of DAYS) {
    const container = dayColumnRefs.value[d.value]
    if (!container) continue
    useSortable(container, undefined, {
      animation: 150,
      group: 'kanban',
      onEnd: (evt: any) => onDrop(evt, d.value),
    })
  }
})

// ─── Modal: Crear / Editar sesión ───
const isOpen = ref(false)
const saving = ref(false)

interface SessionForm {
  id: string | null
  title: string
  isRecurring: boolean
  dayOfWeek: string
  date: string
  startTime: string
  endTime: string
  location: string
}

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

function openEdit(s: any) {
  form.id = s.id
  form.title = s.title
  form.isRecurring = s.isRecurring
  form.dayOfWeek = s.dayOfWeek ?? 'MONDAY'
  form.date = s.date ? new Date(s.date).toISOString().split('T')[0] : ''
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
      await $fetch('/api/schedule', {
        method: 'PUT',
        body: { ...form, date: form.date || null },
      })
      toast.add({ title: 'Sesión actualizada.', color: 'success' })
    } else {
      await $fetch('/api/schedule', {
        method: 'POST',
        body: {
          title: form.title,
          isRecurring: form.isRecurring,
          dayOfWeek: form.isRecurring ? form.dayOfWeek : null,
          date: !form.isRecurring ? form.date : null,
          startTime: form.startTime,
          endTime: form.endTime,
          location: form.location,
          subjectId: subjectId.value,
        },
      })
      toast.add({ title: 'Sesión creada.', color: 'success' })
    }
    isOpen.value = false
    await refresh()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage ?? 'No se pudo guardar la sesión.', color: 'error' })
  } finally {
    saving.value = false
  }
}

// ─── Eliminar sesión ───
const deletingId = ref('')
async function removeSession(id: string) {
  deletingId.value = id
  try {
    await $fetch('/api/schedule', { method: 'DELETE', query: { id } })
    toast.add({ title: 'Sesión eliminada.', color: 'success' })
    await refresh()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage ?? 'No se pudo eliminar.', color: 'error' })
  } finally {
    deletingId.value = ''
  }
}
</script>

<template>
  <div class="space-y-10">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h2 class="text-2xl font-bold text-highlighted">Horario Semanal</h2>
      <UButton
        color="primary"
        icon="i-heroicons-plus"
        label="Nueva sesión"
        @click="openNew"
      />
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-heroicons-exclamation-triangle"
      title="No se pudo cargar el horario."
      class="mb-6"
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar la plataforma.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="refresh">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <!-- Skeleton de carga -->
    <div v-else-if="status === 'pending'" class="grid grid-cols-7 gap-3">
      <div v-for="d in 7" :key="d" class="space-y-3">
        <div v-for="i in 2" :key="i">
          <USkeleton class="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>

    <!-- Kanban -->
    <template v-else>
      <ClientOnly>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div
            v-for="d in DAYS"
            :key="d.value"
            :ref="(el: any) => { dayColumnRefs[d.value] = el as HTMLElement | null }"
            :data-day="d.value"
            class="min-h-[180px] rounded-xl bg-muted/30 border border-muted/50 p-2 flex flex-col gap-2"
          >
            <span class="text-xs font-bold text-highlighted uppercase tracking-wider px-1 pb-1 border-b border-muted/40 text-center">
              {{ d.label }}
            </span>

            <UCard
              v-for="session in columns[d.value]"
              :key="session.id"
              :data-id="session.id"
              :ui="{ base: 'cursor-grab active:cursor-grabbing border-t-2 border-t-primary shadow-sm text-sm', body: 'p-3 space-y-1.5' }"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-default line-clamp-1">{{ session.title }}</span>
                <div class="flex gap-0.5 shrink-0">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-pencil-square"
                    size="xs"
                    aria-label="Editar"
                    @click="openEdit(session)"
                  />
                  <UButton
                    color="error"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    size="xs"
                    :loading="deletingId === session.id"
                    aria-label="Eliminar"
                    @click="removeSession(session.id)"
                  />
                </div>
              </div>
              <div class="flex items-center gap-2 text-xs text-muted">
                <UIcon name="i-heroicons-clock" class="size-3" />
                {{ session.startTime }} – {{ session.endTime }}
              </div>
              <div v-if="session.location" class="flex items-center gap-2 text-xs text-muted">
                <UIcon name="i-heroicons-map-pin" class="size-3" />
                {{ session.location }}
              </div>
            </UCard>
          </div>
        </div>

        <template #fallback>
          <div class="grid grid-cols-7 gap-3">
            <div v-for="d in 7" :key="d">
              <USkeleton v-for="i in 2" :key="i" class="h-28 w-full rounded-xl mb-3" />
            </div>
          </div>
        </template>
      </ClientOnly>

      <!-- Sesiones extraordinarias -->
      <section>
        <div class="flex items-center gap-3 mb-4">
          <UIcon name="i-heroicons-star" class="text-xl text-warning" />
          <h3 class="text-lg font-bold text-highlighted">Sesiones Extraordinarias</h3>
        </div>

        <div
          v-if="extraordinarySessions.length === 0"
          class="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-muted"
        >
          <p class="text-muted text-sm">No hay sesiones extraordinarias registradas.</p>
        </div>

        <div v-else class="space-y-3">
          <UCard
            v-for="session in extraordinarySessions"
            :key="session.id"
            :ui="{ base: 'border-l-4 border-l-warning' }"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 class="font-bold text-default">{{ session.title }}</h4>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted">
                  <span v-if="session.date" class="flex items-center gap-1.5">
                    <UIcon name="i-heroicons-calendar-days" class="size-4" />
                    {{ formatFullDate(session.date) }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <UIcon name="i-heroicons-clock" class="size-4" />
                    {{ session.startTime }} – {{ session.endTime }}
                  </span>
                  <span v-if="session.location" class="flex items-center gap-1.5">
                    <UIcon name="i-heroicons-map-pin" class="size-4" />
                    {{ session.location }}
                  </span>
                </div>
              </div>
              <div class="flex gap-1 shrink-0">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-pencil-square"
                  size="sm"
                  aria-label="Editar"
                  @click="openEdit(session)"
                />
                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="sm"
                  :loading="deletingId === session.id"
                  aria-label="Eliminar"
                  @click="removeSession(session.id)"
                />
              </div>
            </div>
          </UCard>
        </div>
      </section>
    </template>

    <!-- Modal: Crear / Editar sesión -->
    <UModal v-model:open="isOpen" :title="form.id ? 'Editar sesión' : 'Nueva sesión'" :ui="{ content: 'max-w-lg' }">
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
            :items="DAYS.map(d => ({ label: d.label, value: d.value }))"
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
    </UModal>
  </div>
</template>