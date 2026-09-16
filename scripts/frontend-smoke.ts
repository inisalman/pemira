import assert from 'node:assert/strict'

const base = process.env.FRONTEND_TEST_URL ?? 'http://localhost:3101'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Smoke hanya untuk server fixture lokal.')
const cookies = new Map<string, string>()
async function call(path: string, body?: Record<string, unknown>, csrf = true) {
  const response = await fetch(`${base}/api/v1${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'content-type': 'application/json',
      cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; '),
      ...(csrf && cookies.has('pemira_csrf') ? { 'x-csrf-token': cookies.get('pemira_csrf')! } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(';')
    const split = pair!.indexOf('=')
    cookies.set(pair!.slice(0, split), pair!.slice(split + 1))
  }
  return { status: response.status, data: await response.json() }
}

const original = 'SimulasiFrontend2026!'
const replacement = 'SimulasiFrontendBaru2026!'
const login = (password: string) => call('/auth/login', { loginKind: 'STUDENT', identifier: '001234', password })
assert.equal((await call('/voting/elections')).status, 401)
assert.equal((await login(original)).status, 200)
const elections = await call('/voting/elections')
assert.equal(elections.data.elections[0].id, 'frontend-election', 'Server harus memakai database fixture.')
assert.equal((await call('/auth/change-password', { currentPassword: original, newPassword: replacement }, false)).status, 403)
assert.equal((await call('/auth/change-password', { currentPassword: 'wrong-password', newPassword: replacement })).status, 401)
assert.equal((await call('/me')).status, 200, 'Password lama salah tidak mencabut sesi.')
const before = (await call('/voting/contests/BEM')).data.contest
assert.equal((await call('/auth/change-password', { currentPassword: original, newPassword: replacement })).status, 200)
try {
  assert.equal((await call('/me')).status, 401, 'Ganti password mencabut sesi lama.')
  assert.equal((await login(original)).status, 401)
  assert.equal((await login(replacement)).status, 200)
  assert.deepEqual((await call('/voting/contests/BEM')).data.contest, before, 'Partisipasi tetap sama.')
} finally {
  await login(replacement)
  assert.equal((await call('/auth/change-password', { currentPassword: replacement, newPassword: original })).status, 200)
}
assert.equal((await login(original)).status, 200)
assert.equal((await call('/auth/logout', {})).status, 200)
assert.equal((await call('/me')).status, 401)
console.log('PASS: protected routes, CSRF, password validation, session revocation, participation persistence, logout.')
