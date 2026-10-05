import type { Announcement } from '~/types/announcements'
import { isPollExpired, resolveCheckStatus, type PollCheckResponse, type PollCheckStatus } from '~/utils/poll'

/**
 * Estado y lógica de una votación individual (verificación de correo + voto).
 * Cada PollCard crea su propia instancia, por lo que el estado es local.
 */
export function usePollVoting(announcement: Ref<Announcement>, onVoted: () => void) {
  const toast = useToast()
  const studentEmailCookie = useCookie<string>('student_email', { default: () => '' })

  const email = ref(studentEmailCookie.value || '')
  const checking = ref(false)
  const voting = ref(false)
  const selectedOptionId = ref('')
  const votedOptionId = ref<string | null>(null)
  const errorMessage = ref('')
  const checkStatus = ref<PollCheckStatus>('idle')

  const expired = computed(() => isPollExpired(announcement.value.deadline))

  async function verifyEmail() {
    const cleanEmail = email.value.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      errorMessage.value = 'Por favor ingresa un correo válido.'
      return
    }

    errorMessage.value = ''
    checking.value = true

    try {
      const res = await $fetch<PollCheckResponse>(`/api/announcements/${announcement.value.id}/check`, {
        query: { email: cleanEmail },
      })

      studentEmailCookie.value = cleanEmail
      checkStatus.value = resolveCheckStatus(res)
      if (checkStatus.value === 'already_voted') votedOptionId.value = res.votedOptionId
    } catch (e: any) {
      errorMessage.value = e?.data?.statusMessage ?? 'No se pudo verificar el correo.'
    } finally {
      checking.value = false
    }
  }

  function resetEmail() {
    checkStatus.value = 'idle'
    selectedOptionId.value = ''
    errorMessage.value = ''
  }

  async function submitVote() {
    if (!selectedOptionId.value) {
      toast.add({ title: 'Selecciona una opción para votar.', color: 'warning' })
      return
    }

    voting.value = true
    try {
      await $fetch(`/api/announcements/${announcement.value.id}/vote`, {
        method: 'POST',
        body: {
          email: email.value.trim().toLowerCase(),
          optionId: selectedOptionId.value,
        },
      })

      votedOptionId.value = selectedOptionId.value
      checkStatus.value = 'already_voted'
      toast.add({
        title: '¡Voto registrado con éxito!',
        description: 'Tu respuesta ha sido guardada.',
        color: 'success',
      })
      onVoted()
    } catch (e: any) {
      toast.add({
        title: e?.data?.statusMessage ?? 'No se pudo registrar tu voto.',
        color: 'error',
      })
    } finally {
      voting.value = false
    }
  }

  /** Auto-verificación al montar (solo cliente). */
  function init() {
    if (expired.value) {
      checkStatus.value = 'expired'
    } else if (email.value.trim()) {
      verifyEmail()
    }
  }

  return {
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
  }
}
