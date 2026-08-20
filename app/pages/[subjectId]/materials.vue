<script setup lang="ts">
const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const { data: materials, status, error, refresh } = await useFetch('/api/materials', {
  query: { subjectId },
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl font-bold text-highlighted">Material de Apoyo</h2>
    </div>

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

    <div v-else-if="materials?.length === 0" class="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-muted">
      <UIcon name="i-heroicons-folder-open" class="text-4xl text-muted mb-4" />
      <h3 class="text-lg font-semibold text-highlighted mb-2">No hay materiales</h3>
      <p class="text-muted max-w-sm mx-auto">
        No se han subido materiales para esta asignatura aún.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="material in materials"
        :key="material.id"
        :ui="{
          base: 'group flex flex-col h-full border border-muted hover:border-secondary transition-colors',
          body: 'flex flex-col h-full gap-4',
        }"
      >
        <div class="flex-1">
          <div class="flex items-start gap-3 mb-2">
            <div class="p-2 rounded-lg bg-secondary/10 text-secondary mt-0.5">
              <UIcon name="i-heroicons-document-text" class="size-5" />
            </div>
            <div>
              <h3 class="font-bold text-default line-clamp-2">{{ material.title }}</h3>
            </div>
          </div>
          <p v-if="material.description" class="text-sm text-muted line-clamp-3 ml-12">
            {{ material.description }}
          </p>
        </div>

        <div class="pt-4 mt-auto border-t border-muted/30 flex justify-end">
          <UButton
            :to="material.fileUrl"
            target="_blank"
            color="secondary"
            variant="soft"
            icon="i-heroicons-arrow-top-right-on-square"
            label="Abrir enlace"
            size="sm"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>