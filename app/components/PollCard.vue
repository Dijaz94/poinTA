<script setup lang="ts">
import { usePollVoting } from '~/composables/usePollVoting'
import { pluralVotes } from '~/utils/poll'
import { formatTimeRemaining } from '~/utils/calendar'
import type { Announcement } from '~/types/announcements'

const props = defineProps<{
  announcement: Announcement
  index?: string | number
}>()

const emit = defineEmits<{
  voted: []
}>()

const {
  email,
  checking,
  voting,
  selectedOptionId,
  votedOptionId,
  errorMessage,
  checkStatus,
  expired,
  verifyEmail,
  resetEmail,
  submitVote,
  init,
} = usePollVoting(toRef(props, 'announcement'), () => emit('voted'))

const isClosed = computed(() => expired.value || checkStatus.value === 'expired')

onMounted(init)
</script>

<template>
  <TechnicalCard
    :index="index"
    :eyebrow="isClosed ? 'CONSULTA CERRADA' : 'VOTACIÓN ACTIVA'"
    :accent="isClosed ? 'none' : 'terracotta'"
  >
    <template #meta>
      <div class="flex flex-wrap items-center gap-2">
        <span
          v-if="announcement.deadline"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] font-tech text-[11px] font-semibold border"
          :class="isClosed
            ? 'bg-[var(--atelier-surface)] border-[var(--atelier-border)] text-muted'
            : 'bg-[var(--atelier-terracotta-soft)] border-[var(--atelier-terracotta-border)] text-[var(--atelier-terracotta)]'"
          :title="formatDateTime(announcement.deadline)"
        >
          <UIcon :name="isClosed ? 'i-lucide-lock' : 'i-lucide-timer'" class="size-3" />
          {{ isClosed ? 'CERRADA' : formatTimeRemaining(announcement.deadline) }}
        </span>

        <span class="font-tech text-xs text-muted hidden sm:inline">
          {{ formatDateTime(announcement.createdAt) }}
        </span>
      </div>
    </template>

    <div class="space-y-4">
      <div>
        <h3 class="font-editorial text-xl sm:text-2xl font-medium text-highlighted leading-snug">
          {{ announcement.title }}
        </h3>
        <p v-if="announcement.content" class="text-sm sm:text-base text-default whitespace-pre-wrap leading-relaxed mt-1.5 max-w-3xl">
          {{ announcement.content }}
        </p>
      </div>

      <!-- Votación finalizada -->
      <div v-if="isClosed" class="space-y-3 pt-3 border-t border-[var(--atelier-border-muted)]">
        <div class="flex items-center justify-between text-xs font-tech">
          <span class="flex items-center gap-1.5 text-muted">
            <UIcon name="i-lucide-lock" class="size-3.5" />
            PLAZO FINALIZADO // RESULTADOS DEFINITIVOS
          </span>
          <span class="font-semibold text-highlighted">
            {{ announcement.totalVotes ?? 0 }} {{ pluralVotes(announcement.totalVotes ?? 0, true).toUpperCase() }}
          </span>
        </div>
        <PollResults :options="announcement.options" :total-votes="announcement.totalVotes" />
      </div>

      <!-- Ya votó -->
      <div v-else-if="checkStatus === 'already_voted'" class="space-y-4 pt-3 border-t border-[var(--atelier-border-muted)]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-[6px] bg-[var(--atelier-lichen-soft)] border border-[var(--atelier-lichen-border)] text-xs sm:text-sm">
          <div class="flex items-center gap-2 text-[var(--atelier-lichen)]">
            <UIcon name="i-lucide-circle-check" class="size-4 shrink-0" />
            <span>Voto registrado con el correo <strong class="font-tech">{{ email }}</strong></span>
          </div>
          <button
            type="button"
            class="self-end sm:self-auto min-h-[36px] px-2.5 rounded-[4px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)] font-tech text-xs text-toned hover:text-highlighted transition-colors"
            @click="resetEmail"
          >
            CAMBIAR CORREO
          </button>
        </div>

        <div class="flex items-center justify-between text-xs font-tech text-muted pt-1">
          <span>CÓMPUTO PARCIAL EN CURSO</span>
          <span class="text-highlighted font-semibold">
            {{ announcement.totalVotes ?? 0 }} {{ pluralVotes(announcement.totalVotes ?? 0, true).toUpperCase() }}
          </span>
        </div>
        <PollResults
          :options="announcement.options"
          :total-votes="announcement.totalVotes"
          :voted-option-id="votedOptionId"
        />
      </div>

      <!-- Correo no autorizado -->
      <div v-else-if="checkStatus === 'not_authorized'" class="space-y-3 pt-3 border-t border-[var(--atelier-border-muted)]">
        <div class="p-3.5 rounded-[6px] bg-[var(--atelier-terracotta-soft)] border border-[var(--atelier-terracotta-border)] text-[var(--atelier-terracotta)] text-sm flex items-start gap-2.5">
          <UIcon name="i-lucide-circle-alert" class="size-5 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="font-semibold">Correo no habilitado en el padrón de esta votación</p>
            <p class="text-xs text-default">
              La dirección <strong class="font-tech">{{ email }}</strong> no figura en la nómina autorizada de la asignatura.
            </p>
          </div>
        </div>
        <div class="flex justify-end">
          <UButton size="sm" variant="soft" color="neutral" label="Intentar con otro correo" @click="resetEmail" />
        </div>
      </div>

      <!-- Autorizado: elegir opción -->
      <PollVoteForm
        v-else-if="checkStatus === 'authorized'"
        v-model:selected="selectedOptionId"
        :options="announcement.options"
        :email="email"
        :voting="voting"
        @submit="submitVote"
        @reset="resetEmail"
      />

      <!-- Idle: pedir correo -->
      <PollEmailForm
        v-else
        v-model:email="email"
        :options="announcement.options"
        :checking="checking"
        :error-message="errorMessage"
        @submit="verifyEmail"
      />
    </div>
  </TechnicalCard>
</template>
