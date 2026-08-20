<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { data: users, status, error, refresh } = await useFetch('/api/admin/users')

const showCreate = ref(false)
const form = reactive({ name: '', email: '', password: '' })
const creating = ref(false)
const createError = ref('')

const { data: allSubjects } = await useFetch('/api/subjects')
const selectedSubjectIds = ref<string[]>([])

const handleCreate = async () => {
  creating.value = true
  createError.value = ''
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        password: form.password,
        subjectIds: selectedSubjectIds.value,
      },
    })
    showCreate.value = false
    form.name = ''
    form.email = ''
    form.password = ''
    selectedSubjectIds.value = []
    await refresh()
  } catch (e: any) {
    createError.value = e.data?.statusMessage ?? 'Error al crear el usuario.'
  } finally {
    creating.value = false
  }
}

const showEdit = ref(false)
const editingUser = ref<any>(null)
const editForm = reactive({ role: '' as string, addSubjectIds: [] as string[], removeSubjectIds: [] as string[] })

const openEdit = (u: any) => {
  editingUser.value = u
  editForm.role = u.role
  editForm.addSubjectIds = []
  editForm.removeSubjectIds = []
  showEdit.value = true
}

const handleEdit = async () => {
  if (!editingUser.value) return
  try {
    await $fetch(`/api/admin/users/${editingUser.value.id}`, {
      method: 'PATCH',
      body: {
        role: editForm.role,
        addSubjectIds: editForm.addSubjectIds.length ? editForm.addSubjectIds : undefined,
        removeSubjectIds: editForm.removeSubjectIds.length ? editForm.removeSubjectIds : undefined,
      },
    })
    showEdit.value = false
    await refresh()
  } catch (e: any) {
    alert(e.data?.statusMessage ?? 'Error al actualizar.')
  }
}

const handleDelete = async (userId: string) => {
  if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
  try {
    await $fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    alert(e.data?.statusMessage ?? 'Error al eliminar.')
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-highlighted font-display">Gestionar Ayudantes</h1>
        <p class="mt-2 text-muted">Crear cuentas, asignar asignaturas y gestionar roles.</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" label="Crear ayudante" @click="showCreate = true" />
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-heroicons-exclamation-triangle"
      title="No se pudieron cargar los usuarios."
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="refresh">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <div v-else-if="status === 'pending'" class="space-y-3">
      <USkeleton v-for="i in 4" :key="i" class="h-16 w-full rounded-lg" />
    </div>

    <div v-else-if="!users?.length" class="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-muted">
      <UIcon name="i-heroicons-users" class="text-4xl text-muted mb-4 mx-auto" />
      <h3 class="text-lg font-semibold text-highlighted mb-2">No hay ayudantes registrados</h3>
      <p class="text-muted max-w-sm mx-auto mb-4">Crea la primera cuenta de ayudante para comenzar.</p>
      <UButton color="primary" icon="i-heroicons-plus" label="Crear ayudante" @click="showCreate = true" />
    </div>

    <div v-else class="space-y-3">
      <UCard v-for="u in users" :key="u.id" :ui="{ body: 'flex items-center justify-between gap-4 p-4' }">
        <div class="flex items-center gap-4 min-w-0">
          <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span class="text-sm font-bold text-primary">{{ u.name?.charAt(0)?.toUpperCase() ?? '?' }}</span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-highlighted truncate">{{ u.name }}</span>
              <UBadge :color="u.role === 'ADMIN' ? 'primary' : 'neutral'" variant="soft" size="sm">
                {{ u.role }}
              </UBadge>
            </div>
            <p class="text-sm text-muted truncate">{{ u.email }}</p>
            <p v-if="u.subjects?.length" class="text-xs text-muted mt-0.5">
              {{ u.subjects.map((s: any) => s.name).join(', ') }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton color="neutral" variant="ghost" size="sm" icon="i-heroicons-pencil-square" @click="openEdit(u)" />
          <UButton color="error" variant="ghost" size="sm" icon="i-heroicons-trash" @click="handleDelete(u.id)" />
        </div>
      </UCard>
    </div>

    <!-- Create User Modal -->
    <UModal v-model:open="showCreate" title="Crear ayudante">
      <template #body>
        <form class="space-y-4" @submit.prevent="handleCreate">
          <UFormField label="Nombre" name="name" required>
            <UInput v-model="form.name" placeholder="Nombre completo" class="w-full" />
          </UFormField>
          <UFormField label="Correo electrónico" name="email" required>
            <UInput v-model="form.email" type="email" placeholder="ayudante@correo.cl" class="w-full" />
          </UFormField>
          <UFormField label="Contraseña" name="password" required>
            <UInput v-model="form.password" type="password" placeholder="Mínimo 6 caracteres" class="w-full" />
          </UFormField>
          <div v-if="allSubjects?.length" class="space-y-2">
            <label class="text-sm font-medium text-default">Asignaturas iniciales</label>
            <USelectMenu
              v-model="selectedSubjectIds"
              :items="allSubjects.map((s: any) => ({ label: `${s.name} (${s.code ?? s.semester})`, value: s.id }))"
              multiple
              placeholder="Seleccionar asignaturas (opcional)"
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
            <UButton type="submit" color="primary" label="Crear cuenta" :loading="creating" />
          </div>
        </form>
      </template>
    </UModal>

    <!-- Edit User Modal -->
    <UModal v-model:open="showEdit" :title="`Editar ${editingUser?.name ?? ''}`">
      <template #body>
        <form class="space-y-4" @submit.prevent="handleEdit">
          <UFormField label="Rol" name="role">
            <USelect
              v-model="editForm.role"
              :items="[{ label: 'Administrador', value: 'ADMIN' }, { label: 'Ayudante', value: 'TA' }]"
              class="w-full"
            />
          </UFormField>
          <div v-if="allSubjects?.length" class="space-y-2">
            <label class="text-sm font-medium text-default">Agregar asignaturas</label>
            <USelectMenu
              v-model="editForm.addSubjectIds"
              :items="allSubjects
                .filter((s: any) => !editingUser?.subjects?.some((us: any) => us.id === s.id))
                .map((s: any) => ({ label: `${s.name} (${s.code ?? s.semester})`, value: s.id }))"
              multiple
              placeholder="Seleccionar para agregar"
              class="w-full"
            />
          </div>
          <div v-if="editingUser?.subjects?.length" class="space-y-2">
            <label class="text-sm font-medium text-default">Remover asignaturas</label>
            <USelectMenu
              v-model="editForm.removeSubjectIds"
              :items="editingUser.subjects.map((s: any) => ({ label: s.name, value: s.id }))"
              multiple
              placeholder="Seleccionar para remover"
              class="w-full"
            />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <UButton color="neutral" variant="ghost" label="Cancelar" @click="showEdit = false" />
            <UButton type="submit" color="primary" label="Guardar cambios" />
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
