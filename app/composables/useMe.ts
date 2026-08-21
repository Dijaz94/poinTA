import type { Me } from '~/types/users'

export const useMe = () => {
  return useFetch<Me>('/api/auth/me', {
    key: 'auth-me',
    getCachedData(key, nuxtApp) {
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
    }
  })
}
