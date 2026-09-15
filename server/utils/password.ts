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

/** Generate a random password (>= 16 chars per SDD section 5). */
export function generatePassword(length = 16): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return out
}
