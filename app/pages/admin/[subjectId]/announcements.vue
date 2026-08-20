<script setup lang="ts">
import type { Announcement } from '~/types/announcements'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)
const toast = useToast()

const { data: announcements, status, error, refresh } = await useFetch<Announcement[]>('/api/announcements', {
  query: { subjectId },
})

const title = ref('')
const content = ref('')
const submitting = ref(false)
const deletingId = ref('')

const submit = async () => {
  if (!title.value.trim() || !content.value.trim()) {
    toast.add({ title: 'Completa el título y el contenido.', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/admin/announcements', {
      method: 'POST',
      body: {
        title: title.value.trim(),
        content: content.value.trim(),
        subjectId: subjectId.value,
      },
    })
    title.value = ''
    content.value = ''
    toast.add({ title: 'Anuncio publicado.', color: 'success' })
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
</script>

<template>
  <div class="space-y-8">
    <!-- Crear anuncio -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-bold text-highlighted">Publicar anuncio</h2>
      </template>

      <form class="space-y-5" @submit.prevent="submit">
        <UFormField label="Título" name="title">
          <UInput v-model="title" placeholder="Título del anuncio" class="w-full" />
        </UFormField>

        <UFormField label="Contenido" name="content">
          <UTextarea v-model="content" placeholder="Escribe el anuncio..." class="w-full" :rows="5" />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          icon="i-heroicons-megaphone"
          label="Publicar anuncio"
          :loading="submitting"
        />
      </form>
    </UCard>

    <!-- Lista de anuncios -->
    <div>
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
        <p class="text-muted">Aún no hay anuncios publicados para esta asignatura.</p>
      </div>

      <div v-else class="space-y-4">
        <UCard
          v-for="announcement in announcements"
          :key="announcement.id"
          :ui="{ root: 'border-l-4 border-l-primary' }"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-3 mb-1">
                <h3 class="font-bold text-lg text-default truncate">{{ announcement.title }}</h3>
                <span class="text-xs text-muted whitespace-nowrap">
                  {{ formatDateTime(announcement.createdAt) }}
                </span>
              </div>
              <p class="text-default whitespace-pre-wrap leading-relaxed">{{ announcement.content }}</p>
            </div>

            <UButton
              color="error"
              variant="soft"
              icon="i-heroicons-trash"
              :loading="deletingId === announcement.id"
              aria-label="Eliminar anuncio"
              @click="remove(announcement.id)"
            />
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>