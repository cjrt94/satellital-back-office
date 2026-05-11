export default defineNuxtConfig({
  app: {
    head: {
      title: 'Satellital Back Office',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },
  compatibilityDate: '2024-11-01',
  future: { compatibilityVersion: 3 },
  modules: ['@nuxt/ui', '@nuxt/fonts'],
  ssr: false,
  fonts: {
    families: [
      { name: 'Poppins', provider: 'google', weights: [300, 400, 500, 600, 700] },
      { name: 'Manrope', provider: 'google', weights: [300, 400, 500, 600, 700] }
    ]
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.FIREBASE_APP_ID || ''
    }
  },
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  }
})
