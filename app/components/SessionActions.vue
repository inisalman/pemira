<script setup lang="ts">
const session = useSession()
const { request } = useApi()
const busy = ref(false)
const error = ref('')
async function logout() {
  busy.value = true
  error.value = ''
  try {
    await request('/api/v1/auth/logout', {})
    session.user.value = null
    await navigateTo('/login')
  } catch (cause) {
    if (isUnauthorized(cause)) await session.expire()
    else error.value = apiErrorMessage(cause)
  } finally { busy.value = false }
}
</script>

<template>
  <div class="session-actions">
    <NuxtLink to="/account">Ganti password</NuxtLink>
    <AppButton variant="secondary" :loading="busy" @click="logout">Keluar</AppButton>
    <AppAlert v-if="error" kind="error" :message="error" />
  </div>
</template>
