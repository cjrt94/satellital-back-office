export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { user, loading } = useAuth()

  // Wait for auth to resolve before making routing decisions
  if (loading.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(loading, (val) => {
        if (!val) { stop(); resolve() }
      }, { immediate: true })
    })
  }

  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})
