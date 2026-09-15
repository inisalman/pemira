import { apiError } from '../../utils/errors'

import { randomUUID } from 'node:crypto'
import { getPool } from '../../../database/db'
import { recordAuditEvent } from '../audit/audit'
import { canTransition, lockElection, requireTransition, type ElectionStatus } from './state'

/**
 * Election/period admin service per SDD sections 3/4 (TASKLIST P3-01, P3-05, P3-06).
 * All writes are transactional and audited; config_version increments on any
 * DRAFT-only config change.
 */

export async function createElection(opts: { actorId: string; name: string; startsAt?: Date; endsAt?: Date }) {
  const pool = getPool()
  if (opts.startsAt && opts.endsAt && opts.endsAt <= opts.startsAt) {
    apiError('VALIDATION_ERROR', 'Waktu selesai harus setelah waktu mulai.')
  }
  const id = randomUUID()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'INSERT INTO elections (id, name, status, starts_at, ends_at) VALUES ($1, $2, $3, $4, $5)',
      [id, opts.name, 'DRAFT', opts.startsAt ?? null, opts.endsAt ?? null],
    )
    await recordAuditEvent(client, {
      actorId: opts.actorId,
      electionId: id,
      action: 'ADMIN_CREATE_ELECTION',
      target: id,
      changes: { name: opts.name },
    })
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
  return { id }
}

export async function updateElectionSchedule(opts: {
  actorId: string
  electionId: string
  name?: string
  startsAt?: Date
  endsAt?: Date
}) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const current = await lockElection(client, opts.electionId)
    if (current.status !== 'DRAFT') {
      apiError('STATE_INVALID', 'Konfigurasi hanya diubah saat DRAFT.')
    }
    const startsAt = opts.startsAt ?? current.starts_at
    const endsAt = opts.endsAt ?? current.ends_at
    if (startsAt && endsAt && endsAt <= startsAt) {
      apiError('VALIDATION_ERROR', 'Waktu selesai harus setelah waktu mulai.')
    }
    await client.query(
      'UPDATE elections SET name = COALESCE($2, name), starts_at = $3, ends_at = $4, config_version = config_version + 1 WHERE id = $1',
      [opts.electionId, opts.name ?? null, startsAt, endsAt],
    )
    await recordAuditEvent(client, {
      actorId: opts.actorId,
      electionId: opts.electionId,
      action: 'ADMIN_UPDATE_ELECTION',
      target: opts.electionId,
      changes: { startsAt, endsAt },
    })
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
  return { status: 'OK' }
}

export async function transitionElection(opts: {
  actorId: string
  approverId?: string
  electionId: string
  to: ElectionStatus
  reason: string
}) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const current = await lockElection(client, opts.electionId)
    requireTransition(current.status, opts.to)
    await client.query('UPDATE elections SET status = $2 WHERE id = $1', [opts.electionId, opts.to])
    await recordAuditEvent(client, {
      actorId: opts.approverId ?? opts.actorId,
      electionId: opts.electionId,
      action: `ADMIN_STATUS_${opts.to}`,
      target: opts.electionId,
      changes: { from: current.status, to: opts.to, reason: opts.reason },
    })
    await client.query('COMMIT')
    return { from: current.status, to: opts.to }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export { canTransition }
