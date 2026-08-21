<script setup lang="ts">
const route = useRoute()
const subjectId = route.params.subjectId as string
</script>

<template>
  <AnnouncementsView :subject-id="subjectId" is-admin />
</template>