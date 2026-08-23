<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Session } from '~/types/sessions'
import type { SessionForm } from '~/types/sessionForm'
import { DAYS, dayLabel } from '~/utils/days'
import ModalDeleteSchedule from '~/components/modalDeleteSchedule.vue'
import SessionCard from '~/components/SessionCard.vue'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)
const toast = useToast()

// ─── Datos ───
const { data: sessions, status, error, refresh } = await useFetch<Session[]>(
  () => `/api/schedule?subjectId=${subjectId.value}`
)

const columns = ref<Record<string, Session[]>>({
  MONDAY: [], TUESDAY: [], WEDNESDAY: [],
  THURSDAY: [], FRIDAY: [], SATURDAY: [], SUNDAY: [],
})

const extraordinarySessions = computed(() =>
  (sessions.value ?? []).filter((s) => !s.isRecurring),
)

function rebuildColumns() {
  const map: Record<string, Session[]> = {}
  for (const d of DAYS) map[d.value] = []
  for (const s of (sessions.value ?? []) as any[]) {
    if (s.isRecurring && s.dayOfWeek && map[s.dayOfWeek]) {
      map[s.dayOfWeek]!.push(s)
    }
  }
  columns.value = map
}

watch(sessions, rebuildColumns, { immediate: true })

// ─── Sortable / Drag & Drop ───
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
  columns.value[toDay]?.push(moved!)

  if (fromDay !== toDay) {
    moved!.dayOfWeek = toDay
    updateDayOfWeek(id, toDay)
  }
}

async function updateDayOfWeek(id: string, day: string) {
  try {
    await $fetch(`/api/admin/schedule/${id}`, {
      method: 'PUT',
      body: { dayOfWeek: day },
    })
    toast.add({ title: `Sesión movida a ${dayLabel(day)}.`, color: 'success' })
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage ?? 'No se pudo actualizar el horario.', color: 'error' })
    await refresh()
  }
}

const vSortable = {
  async mounted(el: HTMLElement, binding: any) {
    const day = binding.value
    const Sortable = (await import('sortablejs')).default
    new Sortable(el, {
      animation: 150,
      group: 'kanban',
      onEnd: (evt: any) => onDrop(evt, day),
    })
  }
}

// ─── Modal Formulario Sesión (Inlined) ───
const isSessionModalOpen = ref(false)
const savingSession = ref(false)

const sessionForm = reactive<SessionForm>({
  id: null,
  title: '',
  isRecurring: true,
  dayOfWeek: 'MONDAY',
  date: '',
  startTime: '14:00',
  endTime: '15:30',
  location: '',
})

function openNewSession() {
  sessionForm.id = null
  sessionForm.title = ''
  sessionForm.isRecurring = true
  sessionForm.dayOfWeek = 'MONDAY'
  sessionForm.date = ''
  sessionForm.startTime = '14:00'
  sessionForm.endTime = '15:30'
  sessionForm.location = ''
  isSessionModalOpen.value = true
}

function openEditSession(s: Session) {
  sessionForm.id = s.id
  sessionForm.title = s.title
  sessionForm.isRecurring = s.isRecurring
  sessionForm.dayOfWeek = s.dayOfWeek ?? 'MONDAY'
  sessionForm.date = s.date ? (new Date(s.date).toISOString().split('T')[0] ?? '') : ''
  sessionForm.startTime = s.startTime
  sessionForm.endTime = s.endTime
  sessionForm.location = s.location ?? ''
  isSessionModalOpen.value = true
}

async function handleSaveSession() {
  if (!sessionForm.title.trim()) {
    toast.add({ title: 'El título es obligatorio.', color: 'warning' })
    return
  }
  if (!sessionForm.startTime || !sessionForm.endTime) {
    toast.add({ title: 'Completa las horas de inicio y término.', color: 'warning' })
    return
  }
  if (!sessionForm.isRecurring && !sessionForm.date) {
    toast.add({ title: 'Para sesiones extraordinarias, indica la fecha.', color: 'warning' })
    return
  }

  savingSession.value = true
  try {
    if (sessionForm.id) {
      await $fetch(`/api/admin/schedule/${sessionForm.id}`, {
        method: 'PUT',
        body: { ...sessionForm, date: sessionForm.date || null },
      })
      toast.add({ title: 'Sesión actualizada.', color: 'success' })
    } else {
      await $fetch('/api/admin/schedule', {
        method: 'POST',
        body: {
          title: sessionForm.title,
          isRecurring: sessionForm.isRecurring,
          dayOfWeek: sessionForm.isRecurring ? sessionForm.dayOfWeek : null,
          date: !sessionForm.isRecurring ? sessionForm.date : null,
          startTime: sessionForm.startTime,
          endTime: sessionForm.endTime,
          location: sessionForm.location,
          subjectId: subjectId.value,
        },
      })
      toast.add({ title: 'Sesión creada.', color: 'success' })
    }
    isSessionModalOpen.value = false
    await refresh()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage ?? 'No se pudo guardar la sesión.', color: 'error' })
  } finally {
    savingSession.value = false
  }
}

// ─── Eliminar sesión ───
const overlay = useOverlay()
const confirmDelete = overlay.create(ModalDeleteSchedule)
const deletingId = ref('')

async function handleRemoveSession(session: Session) {
  const instance = confirmDelete.open({
    title: 'Eliminar sesión',
    description: `¿Estás seguro de que deseas eliminar la sesión "${session.title}"?`
  })

  if (!(await instance.result)) return

  deletingId.value = session.id
  try {
    await $fetch(`/api/admin/schedule/${session.id}`, { method: 'DELETE' })
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
        icon="i-lucide-plus"
        label="Nueva sesión"
        @click="openNewSession"
      />
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="No se pudo cargar el horario."
      class="mb-6"
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar la plataforma.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
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
            class="min-h-[180px] rounded-xl bg-muted/30 border border-muted/50 p-2 flex flex-col gap-2"
          >
            <span class="text-xs font-bold text-highlighted uppercase tracking-wider px-1 pb-1 border-b border-muted/40 text-center">
              {{ d.label }}
            </span>

            <div
              v-sortable="d.value"
              :data-day="d.value"
              class="flex-1 flex flex-col gap-2"
            >
              <SessionCard
                v-for="session in columns[d.value]"
                :key="session.id"
                :session="session"
                :deleting="deletingId === session.id"
                :is-admin="true"
                variant="kanban"
                @edit="openEditSession(session)"
                @delete="handleRemoveSession(session)"
              />
            </div>
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
          <UIcon name="i-lucide-star" class="text-xl text-warning" />
          <h3 class="text-lg font-bold text-highlighted">Sesiones Extraordinarias</h3>
        </div>

        <div
          v-if="extraordinarySessions.length === 0"
          class="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-muted"
        >
          <p class="text-muted text-sm">No hay sesiones extraordinarias registradas.</p>
        </div>

        <div v-else class="space-y-3">
          <SessionCard
            v-for="session in extraordinarySessions"
            :key="session.id"
            :session="session"
            :deleting="deletingId === session.id"
            :is-admin="true"
            variant="extraordinary"
            @edit="openEditSession(session)"
            @delete="handleRemoveSession(session)"
          />
        </div>
      </section>
    </template>

    <!-- Modal Inlined: Crear / Editar sesión -->
    <UModal v-model:open="isSessionModalOpen" :title="sessionForm.id ? 'Editar sesión' : 'Nueva sesión'" :ui="{ content: 'max-w-lg' }">
      <template #body>
        <form class="space-y-5 p-1" @submit.prevent="handleSaveSession">
          <UFormField label="Título" name="title">
            <UInput v-model="sessionForm.title" placeholder="Ej: Ayudantía Sección 1" class="w-full" />
          </UFormField>

          <UFormField label="Tipo de sesión" name="isRecurring">
            <div class="flex gap-4">
              <URadioGroup v-model="sessionForm.isRecurring" :items="[
                { label: 'Recurrente (semanal)', value: true },
                { label: 'Extraordinaria (fecha puntual)', value: false },
              ]" />
            </div>
          </UFormField>

          <UFormField v-if="sessionForm.isRecurring" label="Día de la semana" name="dayOfWeek">
            <USelect
              v-model="sessionForm.dayOfWeek"
              :items="DAYS.map(d => ({ label: d.label, value: d.value as string }))"
              class="w-full"
            />
          </UFormField>

          <UFormField v-else label="Fecha" name="date">
            <UInput v-model="sessionForm.date" type="date" class="w-full" />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Hora inicio" name="startTime">
              <UInput v-model="sessionForm.startTime" type="time" class="w-full" />
            </UFormField>
            <UFormField label="Hora término" name="endTime">
              <UInput v-model="sessionForm.endTime" type="time" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Ubicación (opcional)" name="location">
            <UInput v-model="sessionForm.location" placeholder="Ej: Sala A-102" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-3 pt-2">
            <UButton color="neutral" variant="ghost" label="Cancelar" @click="isSessionModalOpen = false" />
            <UButton
              type="submit"
              color="primary"
              :label="sessionForm.id ? 'Guardar cambios' : 'Crear sesión'"
              :loading="savingSession"
            />
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>