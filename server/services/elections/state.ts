import type { PoolClient } from 'pg'
import { apiError } from '../../utils/errors'

/**
 * Election state machine per SDD section 4. All mutations lock the election
 * row FOR UPDATE inside a transaction so voting-time shared locks conflict
 * correctly (SDD section 7).
 */

export type ElectionStatus = 'DRAFT' | 'READY' | 'OPEN' | 'PAUSED' | 'CLOSED' | 'PUBLISHED' | 'ARCHIVED'

const TRANSITIONS: Record<ElectionStatus, ElectionStatus[]> = {
  DRAFT: ['READY'],
  READY: ['DRAFT', 'OPEN'],
  OPEN: ['PAUSED', 'CLOSED'],
  PAUSED: ['OPEN', 'CLOSED'],
  CLOSED: ['PUBLISHED'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: [],
}

export function canTransition(from: ElectionStatus, to: ElectionStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

/** Lock the election row FOR UPDATE and return it; call inside a transaction. */
export async function lockElection(client: PoolClient, electionId: string) {
  const { rows } = await client.query<{
    id: string
    status: ElectionStatus
    starts_at: Date | null
    ends_at: Date | null
    config_version: number
  }>('SELECT id, status, starts_at, ends_at, config_version FROM elections WHERE id = $1 FOR UPDATE', [electionId])
  if (!rows[0]) apiError('NOT_FOUND', 'Periode tidak ditemukan.')
  return rows[0]
}

/** Assert transition is legal for the current status. */
export function requireTransition(from: ElectionStatus, to: ElectionStatus): void {
  if (!canTransition(from, to)) {
    apiError('STATE_INVALID', `Perubahan status ${from} → ${to} tidak diizinkan.`)
  }
}
