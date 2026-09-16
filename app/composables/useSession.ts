interface UserSession {
  userId: string
  loginKind: 'STUDENT' | 'LECTURER' | 'ADMIN'
  voterId: string | null
  roles: { role: string; electionId: string | null }[]
}

export function useSession() {
  const user = useState<UserSession | null>('session-user', () => null)
  async function refresh() {
    try {
      user.value = await $fetch<UserSession>('/api/v1/me', { retry: 0 })
    } catch (error) {
      if (!isUnauthorized(error)) throw error
      user.value = null
    }
    return user.value
  }
  async function expire() {
    user.value = null
    await navigateTo('/login?reason=expired')
  }
  return { user, refresh, expire }
}
