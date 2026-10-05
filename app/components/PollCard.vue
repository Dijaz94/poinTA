<script setup lang="ts">
import { usePollVoting } from '~/composables/usePollVoting';
import { pluralVotes } from '~/utils/poll';
import type { Announcement } from '~/types/announcements'

const props = defineProps<{
  announcement: Announcement
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
  <UCard
    :ui="{
      root: 'overflow-hidden border-l-4 border-l-indigo-500',
      header: 'pb-2 bg-muted/10',
      body: 'pt-4 space-y-4',
    }"
  >
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div class="flex items-center gap-2">
          <UBadge color="primary" variant="subtle" size="xs">
            <UIcon name="i-lucide-chart-bar" class="size-3 mr-1" />
            Votación
          </UBadge>

          <UBadge
            v-if="announcement.deadline"
            :color="isClosed ? 'error' : 'warning'"
            variant="soft"
            size="xs"
          >
            <UIcon name="i-lucide-clock" class="size-3 mr-1" />
            {{ isClosed ? 'Votación Cerrada' : `Cierra: ${formatDateTime(announcement.deadline)}` }}
          </UBadge>
        </div>

        <div class="flex items-center gap-1.5 text-xs text-muted whitespace-nowrap">
          <UIcon name="i-lucide-clock" class="size-3.5" />
          {{ formatDateTime(announcement.createdAt) }}
        </div>
      </div>
    </template>

    <div>
      <h3 class="font-bold text-lg text-default">{{ announcement.title }}</h3>
      <p v-if="announcement.content" class="text-default text-sm whitespace-pre-wrap leading-relaxed mt-1">
        {{ announcement.content }}
      </p>
    </div>

    <!-- Votación finalizada -->
    <div v-if="isClosed" class="space-y-4 pt-2 border-t border-muted/30">
      <div class="flex items-center justify-between text-xs font-semibold text-muted">
        <span class="flex items-center gap-1 text-error">
          <UIcon name="i-lucide-lock" class="size-3.5" />
          Esta votación ha finalizado. Resultados definitivos:
        </span>
        <span class="text-primary font-bold">
          {{ announcement.totalVotes }} {{ pluralVotes(announcement.totalVotes, true) }}
        </span>
      </div>
      <PollResults :options="announcement.options" :total-votes="announcement.totalVotes" />
    </div>

    <!-- Ya votó -->
    <div v-else-if="checkStatus === 'already_voted'" class="space-y-4 pt-2 border-t border-muted/30">
      <div class="flex items-center justify-between bg-primary/10 text-primary p-3 rounded-xl border border-primary/20 text-xs sm:text-sm">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-circle-check" class="size-5 text-primary shrink-0" />
          <span>¡Ya registraste tu voto con <strong>{{ email }}</strong>!</span>
        </div>
        <UButton size="xs" variant="ghost" color="neutral" label="Cambiar correo" @click="resetEmail" />
      </div>

      <div class="flex items-center justify-between text-xs font-semibold text-muted pt-1">
        <span>Resultados actuales:</span>
        <span class="text-primary font-bold">
          {{ announcement.totalVotes }} {{ pluralVotes(announcement.totalVotes, true) }}
        </span>
      </div>
      <PollResults
        :options="announcement.options"
        :total-votes="announcement.totalVotes"
        :voted-option-id="votedOptionId"
      />
    </div>

    <!-- Correo no autorizado -->
    <div v-else-if="checkStatus === 'not_authorized'" class="space-y-3 pt-2 border-t border-muted/30">
      <div class="bg-error/10 border border-error/20 text-error p-3.5 rounded-xl text-sm flex items-start gap-2.5">
        <UIcon name="i-lucide-circle-alert" class="size-5 shrink-0 mt-0.5" />
        <div class="space-y-1">
          <p class="font-semibold">No autorizado para votar</p>
          <p class="text-xs opacity-90">
            El correo <strong>{{ email }}</strong> no figura en la lista de estudiantes autorizados para esta votación.
          </p>
        </div>
      </div>
      <div class="flex justify-end">
        <UButton size="xs" variant="soft" color="neutral" label="Probar con otro correo" @click="resetEmail" />
      </div>.
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
  </UCard>
</template>
