<script setup lang="ts">
import type { Me, User } from '~/types/users'
import type { Subject } from '~/types/subjects'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { data: me } = await useFetch<Me>('/api/auth/me')
const isAdmin = computed(() => me.value?.role === 'ADMIN')

const { data: subjects, status, error, refresh } = await useFetch<Subject[]>('/api/subjects', {
  query: { mine: 'true' },
})

// Create subject modal
const showCreate = ref(false)
const form = reactive({ name: '', code: '', semester: '' })
const creating = ref(false)
const createError = ref('')

const { data: allUsers } = await useFetch<User[]>('/api/admin/users', {
  query: {},
  immediate: isAdmin.value,
})

const selectedUserIds = ref<string[]>([])

// Delete subject modal
const showDelete = ref(false)
const subjectToDelete = ref<Subject | null>(null)
const deleting = ref(false)
const deleteError = ref('')

const confirmDelete = (subject: Subject) => {
  subjectToDelete.value = subject
  deleteError.value = ''
  showDelete.value = true
}

const handleDelete = async () => {
  if (!subjectToDelete.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await $fetch(`/api/admin/subjects/${subjectToDelete.value.id}`, {
      method: 'DELETE',
    })
    showDelete.value = false
    subjectToDelete.value = null
    await refresh()
    useToast().add({
      title: 'Asignatura eliminada',
      description: 'La asignatura ha sido eliminada correctamente.',
      color: 'success',
      duration: 3000,
    })
  } catch (e: any) {
    deleteError.value = e.data?.statusMessage ?? 'Error al eliminar la asignatura.'
  } finally {
    deleting.value = false
  }
}

const handleCreate = async () => {
  creating.value = true
  createError.value = ''
  try {
    await $fetch('/api/admin/subjects', {
      method: 'POST',
      body: {
        name: form.name,
        code: form.code || undefined,
        semester: form.semester,
        userIds: selectedUserIds.value,
      },
    })
    showCreate.value = false
    form.name = ''
    form.code = ''
    form.semester = ''
    selectedUserIds.value = []
    await refresh()
  } catch (e: any) {
    createError.value = e.data?.statusMessage ?? 'Error al crear la asignatura.'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-highlighted font-display">
          {{ isAdmin ? 'Todas las Asignaturas' : 'Mis Asignaturas' }}
        </h1>
        <p class="mt-2 text-muted">
          {{ isAdmin ? 'Gestiona las asignaturas de la plataforma.' : 'Selecciona una asignatura para gestionar su contenido.' }}
        </p>
      </div>
      <UButton
        v-if="isAdmin"
        color="primary"
        icon="i-heroicons-plus"
        label="Crear asignatura"
        @click="showCreate = true"
      />
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-heroicons-exclamation-triangle"
      title="No se pudieron cargar las asignaturas."
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar la plataforma.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <div v-else-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <USkeleton v-for="i in 3" :key="i" class="h-40 w-full rounded-xl" />
    </div>

    <div
      v-else-if="subjects?.length === 0"
      class="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-muted"
    >
      <UIcon name="i-heroicons-academic-cap" class="text-4xl text-muted mb-4 mx-auto" />
      <h3 class="text-lg font-semibold text-highlighted mb-2">
        {{ isAdmin ? 'No hay asignaturas creadas' : 'Aún no administras asignaturas' }}
      </h3>
      <p class="text-muted max-w-sm mx-auto mb-4">
        {{ isAdmin ? 'Crea la primera asignatura para comenzar.' : 'Pídele a un administrador que te asigne una asignatura.' }}
      </p>
      <UButton v-if="isAdmin" color="primary" icon="i-heroicons-plus" label="Crear asignatura" @click="showCreate = true" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="subject in subjects"
        :key="subject.id"
        :ui="{
          root: 'transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border border-transparent hover:border-secondary/30',
          body: 'flex flex-col h-full justify-between gap-4 p-6',
        }"
      >
        <div>
          <div class="flex items-center justify-between mb-2">
            <UBadge color="secondary" variant="soft" size="sm">{{ subject.semester }}</UBadge>
            <div class="flex items-center gap-2">
              <span class="text-sm font-mono text-muted">{{ subject.code }}</span>
              <UButton
                v-if="isAdmin"
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                size="sm"
                @click="confirmDelete(subject)"
                title="Eliminar asignatura"
              />
            </div>
          </div>
          <h2 class="text-xl font-bold text-highlighted">{{ subject.name }}</h2>
        </div>

        <div class="flex flex-col gap-2">
          <UButton
            :to="`/admin/${subject.id}/announcements`"
            color="primary"
            block
            icon="i-heroicons-wrench-screwdriver"
            label="Administrar"
            size="sm"
          />
          <UButton
            :to="`/${subject.id}`"
            color="neutral"
            variant="ghost"
            block
            icon="i-heroicons-eye"
            label="Ver página pública"
            size="sm"
          />
        </div>
      </UCard>
    </div>

    <!-- Create Subject Modal -->
    <UModal v-model:open="showCreate" title="Crear asignatura">
      <template #body>
        <form class="space-y-4" @submit.prevent="handleCreate">
          <UFormField label="Nombre" name="name" required>
            <UInput v-model="form.name" placeholder="Ej: Álgebra Lineal" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Código" name="code">
              <UInput v-model="form.code" placeholder="Ej: MAT201" class="w-full" />
            </UFormField>
            <UFormField label="Semestre" name="semester" required>
              <UInput v-model="form.semester" placeholder="Ej: 2026-1" class="w-full" />
            </UFormField>
          </div>
          <div v-if="allUsers?.length" class="space-y-2">
            <label class="text-sm font-medium text-default">Ayudantes asignados</label>
            <USelectMenu
              v-model="selectedUserIds"
              :items="allUsers.map((u) => ({ label: `${u.name} (${u.email})`, value: u.id }))"
              value-key="value"
              multiple
              placeholder="Seleccionar ayudantes (opcional)"
              class="w-full"
            />
          </div>
          <UAlert
            v-if="createError"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-circle"
            :description="createError"
          />
          <div class="flex justify-end gap-3 pt-2">
            <UButton color="neutral" variant="ghost" label="Cancelar" @click="showCreate = false" />
            <UButton type="submit" color="primary" label="Crear" :loading="creating" />
          </div>
        </form>
      </template>
    </UModal>

    <!-- Delete Subject Modal -->
    <UModal v-model:open="showDelete" :title="`Eliminar ${subjectToDelete?.name}`">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-default">
            ¿Estás seguro de que deseas eliminar esta asignatura? Esta acción eliminará también todos los anuncios, encuestas y votos asociados.
          </p>
          <UAlert
            v-if="deleteError"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-circle"
            :description="deleteError"
          />
          <div class="flex justify-end gap-3 pt-2">
            <UButton color="neutral" variant="ghost" label="Cancelar" @click="showDelete = false" />
            <UButton color="error" label="Eliminar permanentemente" :loading="deleting" @click="handleDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
