import { onMounted } from 'vue'

const STORAGE_KEY = 'pointa:pinned-subjects:v1'

export function usePinnedSubjects() {
  const pinnedIds = useState<string[]>('pinned-subject-ids', () => [])
  const hydrated = useState<boolean>('pinned-subject-hydrated', () => false)

  const syncFromStorage = () => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          pinnedIds.value = parsed.filter((item): item is string => typeof item === 'string')
        }
      }
    } catch {
      // Ignore storage access errors
    } finally {
      hydrated.value = true
    }
  }

  const persist = () => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedIds.value))
    } catch {
      // Ignore storage write errors
    }
  }

  onMounted(() => {
    if (!hydrated.value) {
      syncFromStorage()
    }
  })

  const isPinned = (subjectId: string): boolean => {
    return pinnedIds.value.includes(subjectId)
  }

  const togglePin = (subjectId: string) => {
    if (!hydrated.value && typeof window !== 'undefined') {
      syncFromStorage()
    }
    const idx = pinnedIds.value.indexOf(subjectId)
    if (idx >= 0) {
      pinnedIds.value = pinnedIds.value.filter(id => id !== subjectId)
    } else {
      pinnedIds.value = [...pinnedIds.value, subjectId]
    }
    persist()
  }

  return {
    pinnedIds,
    isPinned,
    togglePin,
  }
}
