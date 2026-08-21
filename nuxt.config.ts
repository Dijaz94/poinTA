// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'PoinTA — Plataforma de Ayudantías',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },
  modules: ['@nuxt/ui', '@nuxtjs/supabase'],
  supabase: {
    redirect: false,
    types: false
  },
  css: ['~/assets/css/main.css'],
  fonts: {
    families: [
      { name: 'Inter', weights: [400, 500, 600, 700] },
      { name: 'Space Grotesk', weights: [400, 500, 600, 700] },
    ],
  },
  vite: {
    resolve: {
      alias: {
        axios: '~/stubs/axios.mjs',
        drauu: '~/stubs/drauu.mjs',
        'focus-trap': '~/stubs/focus-trap.mjs',
        'idb-keyval': '~/stubs/idb-keyval.mjs',
        'jwt-decode': '~/stubs/jwt-decode.mjs',
      },
    },
  },
})