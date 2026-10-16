<script setup lang="ts">
import type { Announcement } from '~/types/announcements'

defineProps<{
  announcement: Announcement
  index?: string | number
}>()
</script>

<template>
  <TechnicalCard
    :index="index"
    eyebrow="COMUNICADO DOCENTE"
    accent="cobalt"
  >
    <template #meta>
      <span class="inline-flex items-center gap-1.5 font-tech text-xs text-muted">
        <UIcon name="i-lucide-clock" class="size-3.5" />
        {{ formatDateTime(announcement.createdAt) }}
      </span>
    </template>

    <div class="space-y-2.5">
      <h3 class="font-editorial text-xl sm:text-2xl font-medium text-highlighted leading-snug">
        {{ announcement.title }}
      </h3>

      <p class="text-sm sm:text-base text-default whitespace-pre-wrap leading-relaxed max-w-3xl">
        {{ announcement.content }}
      </p>
    </div>
  </TechnicalCard>
</template>
