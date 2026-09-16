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

/** Default contest template — mirrors database/seed.ts CONTESTS. */
export const DEFAULT_CONTESTS = [
  { code: 'BEM', title: 'Ketua dan wakil BEM', office: 'PAIR' as const, optionType: 'PAIR' as const, department: null },
  { code: 'MPM', title: 'Ketua dan wakil MPM', office: 'PAIR' as const, optionType: 'PAIR' as const, department: null },
  { code: 'HIMA_KEP_CHAIR', title: 'Ketua Hima Keperawatan', office: 'CHAIR' as const, optionType: 'SINGLE' as const, department: 'KEP' },
  { code: 'HIMA_KEP_VICE', title: 'Wakil ketua Hima Keperawatan', office: 'VICE_CHAIR' as const, optionType: 'SINGLE' as const, department: 'KEP' },
  { code: 'HIMA_KEB_CHAIR', title: 'Ketua Hima Kebidanan', office: 'CHAIR' as const, optionType: 'SINGLE' as const, department: 'KEB' },
  { code: 'HIMA_KEB_VICE', title: 'Wakil ketua Hima Kebidanan', office: 'VICE_CHAIR' as const, optionType: 'SINGLE' as const, department: 'KEB' },
  { code: 'HIMA_KG_CHAIR', title: 'Ketua Hima Kesehatan Gigi', office: 'CHAIR' as const, optionType: 'SINGLE' as const, department: 'KG' },
  { code: 'HIMA_KG_VICE', title: 'Wakil ketua Hima Kesehatan Gigi', office: 'VICE_CHAIR' as const, optionType: 'SINGLE' as const, department: 'KG' },
  { code: 'HIMA_OP_CHAIR', title: 'Ketua Hima Ortotik Prostetik', office: 'CHAIR' as const, optionType: 'SINGLE' as const, department: 'OP' },
  { code: 'HIMA_OP_VICE', title: 'Wakil ketua Hima Ortotik Prostetik', office: 'VICE_CHAIR' as const, optionType: 'SINGLE' as const, department: 'OP' },
]

export async function createElection(opts: { actorId: string; name: string; startsAt?: Date; endsAt?: Date; skipDefaultContests?: boolean }) {
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

    // Auto-create default contests so candidates can be entered immediately.
    if (!opts.skipDefaultContests) {
      for (const d of DEFAULT_CONTESTS) {
        let deptId: string | null = null
        if (d.department) {
          const res = await client.query<{ id: string }>('SELECT id FROM departments WHERE code = $1', [d.department])
          deptId = res.rows[0]?.id ?? null
        }
        await client.query(
          'INSERT INTO contests (id, election_id, code, title, office, option_type, scope_department_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [randomUUID(), id, d.code, d.title, d.office, d.optionType, deptId],
        )
      }
    }

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
