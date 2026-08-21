<script setup lang="ts">
const route = useRoute()
const subjectId = route.params.subjectId as string
</script>

<template>
  <MaterialsView :subject-id="subjectId" is-admin />
</template>