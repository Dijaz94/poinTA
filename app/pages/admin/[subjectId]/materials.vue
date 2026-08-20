<script setup lang="ts">
const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)
const toast = useToast()

const { data: materials, status, error, refresh } = await useFetch('/api/materials', {
  query: { subjectId },
})

const title = ref('')
const description = ref('')
const fileUrl = ref('')
const submitting = ref(false)
const deletingId = ref('')

const submit = async () => {
  if (!title.value.trim() || !fileUrl.value.trim()) {
    toast.add({ title: 'Completa el título y el enlace del material.', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/admin/materials', {
      method: 'POST',
      body: {
        title: title.value.trim(),
        description: description.value.trim() || null,
        fileUrl: fileUrl.value.trim(),
        subjectId: subjectId.value,
      },
    })
    title.value = ''
    description.value = ''
    fileUrl.value = ''
    toast.add({ title: 'Material agregado.', color: 'success' })
    await refresh()
  } catch (e: any) {
    toast.add({
      title: e?.data?.statusMessage ?? 'No se pudo agregar el material.',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

const remove = async (id: string) => {
  deletingId.value = id
  try {
    await $fetch(`/api/admin/materials/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Material eliminado.', color: 'success' })
    await refresh()
  } catch (e: any) {
    toast.add({
      title: e?.data?.statusMessage ?? 'No se pudo eliminar el material.',
      color: 'error',
    })
  } finally {
    deletingId.value = ''
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Subir material -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-bold text-highlighted">Agregar material</h2>
      </template>

      <form class="space-y-5" @submit.prevent="submit">
        <UFormField label="Título" name="title">
          <UInput v-model="title" placeholder="Ej: Guía de ejercicios N°2" class="w-full" />
        </UFormField>

        <UFormField label="Descripción (opcional)" name="description">
          <UTextarea v-model="description" placeholder="Breve descripción del material..." class="w-full" :rows="3" />
        </UFormField>

        <UFormField label="Enlace del archivo" name="fileUrl">
          <UInput v-model="fileUrl" type="url" placeholder="https://..." class="w-full" />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          icon="i-heroicons-cloud-arrow-up"
          label="Agregar material"
          :loading="submitting"
        />
      </form>
    </UCard>

    <!-- Lista de materiales -->
    <div>
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        title="No se pudieron cargar los materiales."
        class="mb-6"
      >
        <template #description>
          <div class="flex items-center justify-between gap-4">
            <span>Ocurrió un error al consultar la plataforma.</span>
            <UButton color="neutral" variant="soft" size="sm" @click="refresh">Reintentar</UButton>
          </div>
        </template>
      </UAlert>

      <div v-else-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <USkeleton v-for="i in 3" :key="i" class="h-32 w-full rounded-xl" />
      </div>

      <div
        v-else-if="materials?.length === 0"
        class="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-muted"
      >
        <p class="text-muted">No has subido materiales para esta asignatura.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="material in materials"
          :key="material.id"
          :ui="{ base: 'flex flex-col h-full border border-muted', body: 'flex flex-col h-full gap-3' }"
        >
          <div class="flex-1">
            <div class="flex items-start gap-3 mb-2">
              <div class="p-2 rounded-lg bg-secondary/10 text-secondary">
                <UIcon name="i-heroicons-document-text" class="size-5" />
              </div>
              <h3 class="font-bold text-default line-clamp-2">{{ material.title }}</h3>
            </div>
            <p v-if="material.description" class="text-sm text-muted line-clamp-3 ml-11">
              {{ material.description }}
            </p>
          </div>

          <div class="pt-3 mt-auto border-t border-muted/30 flex items-center justify-between gap-2">
            <UButton
              :to="material.fileUrl"
              target="_blank"
              color="secondary"
              variant="soft"
              icon="i-heroicons-arrow-top-right-on-square"
              label="Abrir"
              size="sm"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              :loading="deletingId === material.id"
              aria-label="Eliminar material"
              size="sm"
              @click="remove(material.id)"
            />
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>