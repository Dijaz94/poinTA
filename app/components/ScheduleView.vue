<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Session } from '~/types/sessions'
import { DAYS, dayLabel } from '~/utils/days'
import ModalDeleteSchedule from '~/components/modalDeleteSchedule.vue'
import SessionCard from '~/components/SessionCard.vue'
import ModalSessionForm from '~/components/ModalSessionForm.vue'

const props = defineProps<{
  subjectId: string
  isAdmin?: boolean
}>()

const subjectId = computed(() => props.subjectId)
const toast = useToast()

// ─── Datos ───
const { data: sessions, status, error, refresh } = await useFetch<Session[]>('/api/schedule', {
  query: { subjectId: subjectId.value },
})

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

// ─── Sortable ───
function onDrop(evt: any, fromDay: string) {
  if (!props.isAdmin) return
  const id = (evt.item as HTMLElement).dataset.id
  const toDay = (evt.to as HTMLElement)?.dataset.day
  if (!id || !toDay) return
  moveSession(id, fromDay, toDay)
}

function moveSession(id: string, fromDay: string, toDay: string) {
  if (!props.isAdmin) return
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

// Initialize Sortable dynamically using a custom directive
const vSortable = {
  async mounted(el: HTMLElement, binding: any) {
    if (!props.isAdmin) return
    const day = binding.value
    const Sortable = (await import('sortablejs')).default
    new Sortable(el, {
      animation: 150,
      group: 'kanban',
      onEnd: (evt: any) => onDrop(evt, day),
    })
  }
}

// ─── Modal Formulario Sesión ───
const sessionModalRef = ref<InstanceType<typeof ModalSessionForm> | null>(null)

function openNew() {
  if (!props.isAdmin) return
  sessionModalRef.value?.openNew()
}

function openEdit(s: Session) {
  if (!props.isAdmin) return
  sessionModalRef.value?.openEdit(s)
}

// ─── Eliminar sesión ───
const overlay = useOverlay()
const confirmDelete = overlay.create(ModalDeleteSchedule)

const deletingId = ref('')
async function removeSession(session: Session) {
  if (!props.isAdmin) return
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
        v-if="isAdmin"
        color="primary"
        icon="i-lucide-plus"
        label="Nueva sesión"
        @click="openNew"
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
                :is-admin="isAdmin"
                variant="kanban"
                @edit="isAdmin ? openEdit(session) : undefined"
                @delete="isAdmin ? removeSession(session) : undefined"
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
            :is-admin="isAdmin"
            variant="extraordinary"
            @edit="isAdmin ? openEdit(session) : undefined"
            @delete="isAdmin ? removeSession(session) : undefined"
          />
        </div>
      </section>
    </template>

    <!-- Modal: Crear / Editar sesión -->
    <ModalSessionForm
      v-if="isAdmin"
      ref="sessionModalRef"
      :subject-id="subjectId"
      @saved="refresh"
    />
  </div>
</template>
