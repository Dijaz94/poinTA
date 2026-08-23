<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Announcement } from '~/types/announcements'
import AnnouncementForm from '~/components/AnnouncementForm.vue'
import AdminAnnouncementCard from '~/components/AdminAnnouncementCard.vue'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)
const toast = useToast()

const { data: announcements, status, error, refresh } = await useFetch(
  () => `/api/announcements?subjectId=${subjectId.value}`,
  {
    transform: (data) => data as Announcement[],
  }
)

const submitting = ref(false)
const deletingId = ref('')
const formRef = ref<InstanceType<typeof AnnouncementForm> | null>(null)

const handleSubmit = async (payload: any) => {
  submitting.value = true
  try {
    await $fetch('/api/admin/announcements', {
      method: 'POST',
      body: {
        ...payload,
        subjectId: subjectId.value,
      },
    })

    formRef.value?.resetForm()
    toast.add({
      title: payload.type === 'POLL' ? 'Votación publicada con éxito.' : 'Comunicado publicado.',
      color: 'success',
    })
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

const handleDelete = async (id: string) => {
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
    <!-- Formulario para crear anuncio / votación -->
    <AnnouncementForm
      ref="formRef"
      :submitting="submitting"
      @submit="handleSubmit"
    />

    <!-- Estado de Error -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="No se pudieron cargar los anuncios."
      class="mb-6"
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar la plataforma.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <!-- Lista de Anuncios Publicados -->
    <div v-else>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-bold text-highlighted">Publicaciones anteriores</h3>
      </div>

      <div v-if="status === 'pending'" class="space-y-4">
        <UCard v-for="i in 2" :key="i" class="w-full">
          <div class="space-y-4">
            <USkeleton class="h-6 w-1/3" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-5/6" />
          </div>
        </UCard>
      </div>

      <div
        v-else-if="announcements?.length === 0"
        class="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-muted"
      >
        <p class="text-muted">
          Aún no hay anuncios o votaciones publicadas para esta asignatura.
        </p>
      </div>

      <div v-else class="space-y-4">
        <AdminAnnouncementCard
          v-for="announcement in announcements"
          :key="announcement.id"
          :announcement="announcement"
          :deleting="deletingId === announcement.id"
          @delete="handleDelete"
        />
      </div>
    </div>
  </div>
</template>