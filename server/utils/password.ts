import { hash, verify } from '@node-rs/argon2'

/**
 * Argon2id password hashing per SDD section 5:
 * - memory >= 19 MiB (19456 KiB), 2 iterations, parallelism 1
 * - concurrent hash work limited (semaphore, default 2) to protect RAM/CPU
 */

const ARGON2_OPTS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 }

class HashSemaphore {
  private active = 0
  private readonly waiters: (() => void)[] = []

  constructor(private readonly limit: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.limit) {
      this.active++
      return
    }
    await new Promise<void>((resolve) => this.waiters.push(resolve))
    this.active++
  }

  release(): void {
    this.active--
    const next = this.waiters.shift()
    if (next) next()
  }
}

// Two concurrent hash operations (SDD section 5). Login burst over this
// receives a retryable wait, never a lower hash cost.
const hashSemaphore = new HashSemaphore(2)

export async function hashPassword(password: string): Promise<string> {
  await hashSemaphore.acquire()
  try {
    return await hash(password, ARGON2_OPTS)
  } finally {
    hashSemaphore.release()
  }
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  await hashSemaphore.acquire()
  try {
    return await verify(passwordHash, password, ARGON2_OPTS)
  } finally {
    hashSemaphore.release()
  }
}

/**
 * Constant Argon2id hash of a throwaway string. Used to equalize login timing
 * when the account does not exist, so an attacker cannot distinguish a
 * registered identifier from an unregistered one by response latency
 * (user enumeration via timing side-channel, SDD section 5).
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$9r8KjmQ0cg6jngumao1c0g$MXQdRZoWN9uQVKSPjRdncytG2iX+P/wIQ31djmP1N54'

/**
 * Run a verify against a dummy hash to spend the same CPU/time as a real
 * verify. Always resolves to false; call this when the user was not found so
 * both branches cost the same wall-clock time.
 */
export async function verifyPasswordDummy(password: string): Promise<false> {
  await hashSemaphore.acquire()
  try {
    await verify(DUMMY_HASH, password, ARGON2_OPTS).catch(() => false)
  } finally {
    hashSemaphore.release()
  }
  return false
}

/** Generate a random password (>= 16 chars per SDD section 5). */
export function generatePassword(length = 16): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return out
}
