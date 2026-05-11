<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--color-dark)]">
    <div class="w-full max-w-md px-6">
      <!-- Logo -->
      <div class="text-center mb-10">
        <img
          src="https://cdn.prod.website-files.com/69973777525e04c50e11a1e5/699a32f364e0274382500fb0_logo_white.svg"
          alt="Satellital Patrol"
          class="h-10 mx-auto mb-6"
        />
        <p class="text-[var(--color-text-muted)] text-sm font-[var(--font-body)]">
          Panel de administracion
        </p>
      </div>

      <!-- Login Card -->
      <div class="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl p-8">
        <UForm :state="state" :validate="validate" @submit="onSubmit" class="space-y-5">
          <UFormField label="Email" name="email">
            <UInput
              v-model="state.email"
              type="email"
              placeholder="tu@email.com"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Password" name="password">
            <UInput
              v-model="state.password"
              type="password"
              placeholder="********"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            block
            size="lg"
            :loading="submitting"
            class="mt-2 font-semibold"
          >
            Iniciar sesion
          </UButton>
        </UForm>

        <p v-if="error" class="text-red-400 text-sm mt-4 text-center">{{ error }}</p>
      </div>

      <p class="text-center text-[var(--color-text-muted)] text-xs mt-8">
        Satellital Patrol &copy; {{ new Date().getFullYear() }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { login } = useAuth()
const submitting = ref(false)
const error = ref('')

const state = reactive({
  email: '',
  password: ''
})

const validate = (formState: typeof state) => {
  const errors = []
  if (!formState.email) errors.push({ path: 'email', message: 'Requerido' })
  if (!formState.password) errors.push({ path: 'password', message: 'Requerido' })
  return errors
}

const onSubmit = async () => {
  submitting.value = true
  error.value = ''
  try {
    await login(state.email, state.password)
    navigateTo('/')
  } catch (e: any) {
    error.value = 'Credenciales invalidas'
  } finally {
    submitting.value = false
  }
}
</script>
