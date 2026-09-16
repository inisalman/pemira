export default defineNuxtRouteMiddleware(async (to) => {
  const admin = to.path === '/admin' || to.path.startsWith('/admin/')
  if (to.path === '/admin/login') {
    setPageLayout('default')
    return
  }
  const voter = to.path === '/voter' || to.path.startsWith('/voter/')
  if (!admin && !voter && to.path !== '/account') return
  const session = useSession()
  let user
  try { user = await session.refresh() }
  catch { return navigateTo('/login?reason=unavailable') }
  if (!user) return navigateTo(admin ? '/admin/login?reason=expired' : '/login?reason=expired')
  if (admin && user.loginKind !== 'ADMIN') return navigateTo('/voter')
  if (voter && user.loginKind === 'ADMIN') return navigateTo('/admin')
  setPageLayout(user.loginKind === 'ADMIN' ? 'admin' : 'voter')
})
