<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const { data: subject, status, error } = await useFetch(
  () => `/api/subjects/${subjectId.value}`,
)


</script>

<template>
  <div class="flex flex-col">
    <SubjectHeader :subject-id="subjectId" :subject="subject" :status="status" is-admin />

    <main class="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-lucide-triangle-alert"
        title="No se pudo cargar esta asignatura."
        :description="error.statusMessage ?? 'Intenta nuevamente en unos instantes.'"
      />
      <NuxtPage v-else :subject="subject" />
    </main>
  </div>
</template>