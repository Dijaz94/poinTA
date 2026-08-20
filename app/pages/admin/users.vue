<script setup lang="ts">
import type { User, Me } from '~/types/users'
import type { Subject } from '~/types/subjects'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { data: me } = await useFetch<Me>('/api/auth/me')
const { data: users, status, error, refresh } = await useFetch<User[]>('/api/admin/users')
const { data: allSubjects } = await useFetch<Subject[]>('/api/subjects')

// Create user state
const showCreate = ref(false)
const form = reactive({ name: '', email: '', password: '' })
const selectedSubjectIds = ref<{ label: string; value: string }[]>([])
const creating = ref(false)
const createError = ref('')

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
        subjectIds: selectedSubjectIds.value.map(s => s.value),
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

// Edit user state
const showEdit = ref(false)
const editingUser = ref<User | null>(null)
const editForm = reactive({
  role: '' as string,
  isActive: true,
  addSubjectIds: [] as { label: string; value: string }[],
  removeSubjectIds: [] as { label: string; value: string }[],
})
const savingEdit = ref(false)
const editError = ref('')

const openEdit = (u: User) => {
  editingUser.value = u
  editForm.role = u.role
  editForm.isActive = u.isActive ?? true
  editForm.addSubjectIds = []
  editForm.removeSubjectIds = []
  editError.value = ''
  showEdit.value = true
}

const handleEdit = async () => {
  if (!editingUser.value) return
  savingEdit.value = true
  editError.value = ''
  try {
    await $fetch(`/api/admin/users/${editingUser.value.id}`, {
      method: 'PATCH',
      body: {
        role: editForm.role,
        isActive: editForm.isActive,
        addSubjectIds: editForm.addSubjectIds.length ? editForm.addSubjectIds.map(s => s.value) : undefined,
        removeSubjectIds: editForm.removeSubjectIds.length ? editForm.removeSubjectIds.map(s => s.value) : undefined,
      },
    })
    showEdit.value = false
    await refresh()
  } catch (e: any) {
    editError.value = e.data?.statusMessage ?? 'Error al actualizar el usuario.'
  } finally {
    savingEdit.value = false
  }
}

// Quick status toggle (activate / deactivate)
const togglingId = ref<string | null>(null)
const showStatusConfirm = ref(false)
const targetUser = ref<User | null>(null)
const statusActionError = ref('')

const promptToggleStatus = (u: User) => {
  targetUser.value = u
  statusActionError.value = ''
  showStatusConfirm.value = true
}

const handleConfirmToggleStatus = async () => {
  if (!targetUser.value) return
  const newStatus = !targetUser.value.isActive
  togglingId.value = targetUser.value.id
  statusActionError.value = ''
  try {
    await $fetch(`/api/admin/users/${targetUser.value.id}`, {
      method: 'PATCH',
      body: { isActive: newStatus },
    })
    showStatusConfirm.value = false
    targetUser.value = null
    await refresh()
  } catch (e: any) {
    statusActionError.value = e.data?.statusMessage ?? 'Error al cambiar estado del usuario.'
  } finally {
    togglingId.value = null
  }
}

// Delete user modal & action
const showDeleteConfirm = ref(false)
const userToDelete = ref<User | null>(null)
const deleting = ref(false)
const deleteError = ref('')

const promptDelete = (u: User) => {
  userToDelete.value = u
  deleteError.value = ''
  showDeleteConfirm.value = true
}

const handleConfirmDelete = async () => {
  if (!userToDelete.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await $fetch(`/api/admin/users/${userToDelete.value.id}`, { method: 'DELETE' })
    showDeleteConfirm.value = false
    userToDelete.value = null
    await refresh()
  } catch (e: any) {
    deleteError.value = e.data?.statusMessage ?? 'Error al eliminar el usuario.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-highlighted font-display">Gestionar Ayudantes</h1>
        <p class="mt-2 text-muted">Crear cuentas, activar/desactivar accesos, asignar asignaturas y gestionar roles.</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" label="Crear ayudante" @click="showCreate = true" />
    </div>

    <!-- Main Alert Error -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-heroicons-exclamation-triangle"
      title="No se pudieron cargar los usuarios."
      class="mb-6"
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <!-- Loading Skeleton -->
    <div v-else-if="status === 'pending'" class="space-y-3">
      <USkeleton v-for="i in 4" :key="i" class="h-20 w-full rounded-xl" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!users?.length" class="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-muted">
      <UIcon name="i-heroicons-users" class="text-4xl text-muted mb-4 mx-auto" />
      <h3 class="text-lg font-semibold text-highlighted mb-2">No hay ayudantes registrados</h3>
      <p class="text-muted max-w-sm mx-auto mb-4">Crea la primera cuenta de ayudante para comenzar.</p>
      <UButton color="primary" icon="i-heroicons-plus" label="Crear ayudante" @click="showCreate = true" />
    </div>

    <!-- Users List -->
    <div v-else class="space-y-3">
      <UCard
        v-for="u in users"
        :key="u.id"
        :ui="{
          root: `transition-all duration-200 border ${u.isActive === false ? 'opacity-70 bg-muted/20 border-muted/50' : 'border-muted/30 hover:border-primary/30'}`,
          body: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4',
        }"
      >
        <div class="flex items-center gap-4 min-w-0">
          <div
            class="size-11 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
            :class="u.isActive === false ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'"
          >
            {{ u.name?.charAt(0)?.toUpperCase() ?? '?' }}
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold text-highlighted truncate" :class="{ 'line-through text-muted': u.isActive === false }">
                {{ u.name }}
              </span>
              <UBadge v-if="me?.email === u.email" color="info" variant="subtle" size="xs">
                Tú
              </UBadge>
              <UBadge :color="u.role === 'ADMIN' ? 'primary' : 'neutral'" variant="soft" size="xs">
                {{ u.role }}
              </UBadge>
              <UBadge
                :color="u.isActive === false ? 'error' : 'success'"
                variant="subtle"
                size="xs"
              >
                {{ u.isActive === false ? 'Desactivado' : 'Activo' }}
              </UBadge>
            </div>
            <p class="text-sm text-muted truncate mt-0.5">{{ u.email }}</p>
            <div v-if="u.subjects?.length" class="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span class="text-xs text-muted">Asignaturas:</span>
              <UBadge
                v-for="s in u.subjects"
                :key="s.id"
                color="secondary"
                variant="subtle"
                size="xs"
              >
                {{ s.name }}
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
          <!-- Toggle Active / Inactive Button -->
          <UButton
            v-if="me?.email !== u.email"
            :color="u.isActive === false ? 'success' : 'warning'"
            variant="ghost"
            size="sm"
            :icon="u.isActive === false ? 'i-heroicons-check-circle' : 'i-heroicons-no-symbol'"
            :loading="togglingId === u.id"
            :title="u.isActive === false ? 'Activar cuenta' : 'Desactivar cuenta'"
            @click="promptToggleStatus(u)"
          >
            {{ u.isActive === false ? 'Activar' : 'Desactivar' }}
          </UButton>

          <!-- Edit Button -->
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-heroicons-pencil-square"
            title="Editar usuario"
            @click="openEdit(u)"
          />

          <!-- Delete Button -->
          <UButton
            v-if="me?.email !== u.email"
            color="error"
            variant="ghost"
            size="sm"
            icon="i-heroicons-trash"
            title="Eliminar usuario permanentemente"
            @click="promptDelete(u)"
          />
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
              :items="allSubjects.map((s) => ({ label: `${s.name} (${s.code ?? s.semester})`, value: s.id }))"
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
              :disabled="me?.email === editingUser?.email"
            />
          </UFormField>

          <div v-if="me?.email !== editingUser?.email" class="flex items-center justify-between p-3 rounded-lg border border-muted bg-muted/20">
            <div>
              <p class="text-sm font-medium text-highlighted">Estado de la cuenta</p>
              <p class="text-xs text-muted">
                {{ editForm.isActive ? 'El usuario puede iniciar sesión y gestionar contenidos.' : 'El acceso está bloqueado en el sistema.' }}
              </p>
            </div>
            <USwitch v-model="editForm.isActive" />
          </div>

          <div v-if="allSubjects?.length" class="space-y-2">
            <label class="text-sm font-medium text-default">Agregar asignaturas</label>
            <USelectMenu
              v-model="editForm.addSubjectIds"
              :items="allSubjects
                .filter((s) => !editingUser?.subjects?.some((us) => us.id === s.id))
                .map((s) => ({ label: `${s.name} (${s.code ?? s.semester})`, value: s.id }))"
              multiple
              placeholder="Seleccionar para agregar"
              class="w-full"
            />
          </div>

          <div v-if="editingUser?.subjects?.length" class="space-y-2">
            <label class="text-sm font-medium text-default">Remover asignaturas</label>
            <USelectMenu
              v-model="editForm.removeSubjectIds"
              :items="editingUser.subjects.map((s) => ({ label: s.name, value: s.id }))"
              multiple
              placeholder="Seleccionar para remover"
              class="w-full"
            />
          </div>

          <UAlert
            v-if="editError"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-circle"
            :description="editError"
          />

          <div class="flex justify-end gap-3 pt-2">
            <UButton color="neutral" variant="ghost" label="Cancelar" @click="showEdit = false" />
            <UButton type="submit" color="primary" label="Guardar cambios" :loading="savingEdit" />
          </div>
        </form>
      </template>
    </UModal>

    <!-- Toggle Status Confirmation Modal -->
    <UModal
      v-model:open="showStatusConfirm"
      :title="targetUser?.isActive === false ? 'Activar cuenta' : 'Desactivar cuenta'"
    >
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-default">
            ¿Estás seguro de que deseas
            <strong class="text-highlighted">
              {{ targetUser?.isActive === false ? 'activar' : 'desactivar' }}
            </strong>
            la cuenta de <strong class="text-highlighted">{{ targetUser?.name }}</strong> ({{ targetUser?.email }})?
          </p>
          <p v-if="targetUser?.isActive" class="text-xs text-warning">
            El usuario no podrá iniciar sesión en la plataforma mientras la cuenta permanezca desactivada. Sus asignaturas y datos se conservarán intactos.
          </p>
          <p v-else class="text-xs text-muted">
            El usuario volverá a tener acceso con sus credenciales y asignaturas existentes.
          </p>

          <UAlert
            v-if="statusActionError"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-circle"
            :description="statusActionError"
          />

          <div class="flex justify-end gap-3 pt-2">
            <UButton color="neutral" variant="ghost" label="Cancelar" @click="showStatusConfirm = false" />
            <UButton
              :color="targetUser?.isActive === false ? 'success' : 'warning'"
              :label="targetUser?.isActive === false ? 'Sí, activar' : 'Sí, desactivar'"
              :loading="togglingId === targetUser?.id"
              @click="handleConfirmToggleStatus"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteConfirm" title="Eliminar usuario permanentemente">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-default">
            ¿Estás seguro de que deseas eliminar permanentemente a
            <strong class="text-highlighted">{{ userToDelete?.name }}</strong> ({{ userToDelete?.email }})?
          </p>
          <p class="text-xs text-error font-medium">
            Esta acción es irreversible y eliminará el usuario tanto de la base de datos como de la autenticación.
          </p>

          <UAlert
            v-if="deleteError"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-circle"
            :description="deleteError"
          />

          <div class="flex justify-end gap-3 pt-2">
            <UButton color="neutral" variant="ghost" label="Cancelar" @click="showDeleteConfirm = false" />
            <UButton
              color="error"
              label="Eliminar permanentemente"
              :loading="deleting"
              @click="handleConfirmDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
