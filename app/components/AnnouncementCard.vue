<script setup lang="ts">
import type { Announcement } from '~/types/announcements'

defineProps<{
  announcement: Announcement
}>()
</script>

<template>
  <UCard
    :ui="{
      root: 'border-l-4 border-l-primary',
      header: 'pb-2 bg-muted/10',
      body: 'pt-4',
    }"
  >
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div class="flex items-center gap-2">
          <UBadge color="neutral" variant="subtle" size="xs">
            <UIcon name="i-lucide-megaphone" class="size-3 mr-1" />
            Comunicado
          </UBadge>
          <h3 class="font-bold text-lg text-default">{{ announcement.title }}</h3>
        </div>
        <div class="flex items-center gap-1.5 text-xs text-muted whitespace-nowrap">
          <UIcon name="i-lucide-clock" class="size-3.5" />
          {{ formatDateTime(announcement.createdAt) }}
        </div>
      </div>
    </template>

    <p class="text-default whitespace-pre-wrap leading-relaxed">
      {{ announcement.content }}
    </p>
  </UCard>
</template>
