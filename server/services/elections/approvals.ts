import { randomUUID } from 'node:crypto'
import { apiError } from '../../utils/errors'
import { getPool } from '../../../database/db'
import { recordAuditEvent } from '../audit/audit'
import { transitionElection } from './elections'
import type { ElectionStatus } from './state'

/**
 * Two-account proposal/approval per SDD sections 3/4 and D-10 (TASKLIST P3-06).
 * Emergency pause stays single-officer for speed; recovery and early closure
 * require a different approver. Versions bind the approval to the config.
 */

export type ActionKind = 'OPEN' | 'RECOVER' | 'CLOSE_EARLY' | 'PUBLISH' | 'ARCHIVE'

const ACTION_TO_STATUS: Record<ActionKind, ElectionStatus> = {
  OPEN: 'OPEN',
  RECOVER: 'OPEN',
  CLOSE_EARLY: 'CLOSED',
  PUBLISH: 'PUBLISHED',
  ARCHIVE: 'ARCHIVED',
}

/** Single-officer emergency pause — no approval needed. */
export async function emergencyPause(opts: { actorId: string; electionId: string; reason: string }) {
  await transitionElection({
    actorId: opts.actorId,
    electionId: opts.electionId,
    to: 'PAUSED',
    reason: opts.reason,
  })
  return { status: 'PAUSED' }
}

/** Propose an action that requires approval by a different account. */
export async function proposeAction(opts: {
  actorId: string
  electionId: string
  kind: ActionKind
  payload?: Record<string, unknown>
}) {
  const pool = getPool()
  const targetStatus = ACTION_TO_STATUS[opts.kind]
  const { rows } = await pool.query<{ status: string; config_version: number }>(
    'SELECT status, config_version FROM elections WHERE id = $1', [opts.electionId],
  )
  const election = rows[0]
  if (!election) apiError('NOT_FOUND', 'Periode tidak ditemukan.')

  const needsApproval = opts.kind !== 'OPEN' // opening scheduled transitions handled separately
  if (opts.kind === 'RECOVER' && election.status !== 'PAUSED') {
    apiError('STATE_INVALID', 'Pemulihan hanya dari PAUSED.')
  }
  if (opts.kind === 'CLOSE_EARLY' && election.status !== 'OPEN') {
    apiError('STATE_INVALID', 'Penutupan awal hanya saat OPEN.')
  }
  if (opts.kind === 'PUBLISH' && election.status !== 'CLOSED') {
    apiError('STATE_INVALID', 'Publikasi hanya saat CLOSED.')
  }

  const id = randomUUID()
  await pool.query(
    "INSERT INTO admin_actions (id, election_id, type, payload, config_version, proposer_id, status) VALUES ($1,$2,$3,$4,$5,$6,'PENDING')",
    [id, opts.electionId, opts.kind, JSON.stringify({ ...opts.payload, targetStatus }), election.config_version, opts.actorId],
  )
  if (!needsApproval) {
    // OPEN is executed directly (schedule + readiness already checked at READY).
    await transitionElection({
      actorId: opts.actorId,
      electionId: opts.electionId,
      to: 'OPEN',
      reason: 'Pembukaan oleh petugas periode',
    })
    // Self-executing action: no approver (DB check forbids approver = proposer).
    await pool.query("UPDATE admin_actions SET status = 'APPROVED', decided_at = clock_timestamp() WHERE id = $1", [id])
  }
  return { id, requiresApproval: needsApproval }
}

/** Approve a pending action — approver must differ from proposer, version must match. */
export async function approveAction(opts: { approverId: string; actionId: string }) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query<{
      id: string
      election_id: string
      type: string
      payload: { targetStatus: ElectionStatus }
      config_version: number
      proposer_id: string
      status: string
    }>(
      `SELECT id, election_id, type, payload, config_version, proposer_id, status
       FROM admin_actions WHERE id = $1 FOR UPDATE`,
      [opts.actionId],
    )
    const action = rows[0]
    if (!action) apiError('NOT_FOUND', 'Aksi tidak ditemukan.')
    if (action.status !== 'PENDING') apiError('STATE_INVALID', 'Aksi sudah diputus.')
    if (action.proposer_id === opts.approverId) {
      apiError('FORBIDDEN', 'Pengusul tidak dapat menyetujui usulan sendiri.')
    }
    // Recheck config version at approval time (SDD T-08).
    const { rows: eRows } = await client.query<{ config_version: number; status: string }>(
      'SELECT config_version, status FROM elections WHERE id = $1 FOR UPDATE', [action.election_id],
    )
    const election = eRows[0]
    if (!election) apiError('NOT_FOUND', 'Periode tidak ditemukan.')
    if (election.config_version !== action.config_version) {
      apiError('VERSION_STALE', 'Versi konfigurasi berubah; usulan tidak berlaku.')
    }

    await recordAuditEvent(client, {
      actorId: opts.approverId,
      electionId: action.election_id,
      action: 'ADMIN_ACTION_APPROVED',
      target: action.id,
      changes: { type: action.type },
    })
    await client.query(
      "UPDATE admin_actions SET status = 'APPROVED', approver_id = $2, decided_at = clock_timestamp() WHERE id = $1",
      [opts.actionId, opts.approverId],
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  // Perform the actual transition after approval commit.
  const { rows } = await pool.query<{ type: string; election_id: string }>(
    'SELECT type, election_id FROM admin_actions WHERE id = $1', [opts.actionId],
  )
  const kind = rows[0]?.type as ActionKind
  if (kind === 'RECOVER' || kind === 'CLOSE_EARLY' || kind === 'PUBLISH') {
    await transitionElection({
      actorId: opts.approverId,
      electionId: (await pool.query<{ election_id: string }>('SELECT election_id FROM admin_actions WHERE id = $1', [opts.actionId])).rows[0]?.election_id ?? '',
      to: ACTION_TO_STATUS[kind],
      reason: `Disetujui aksi ${kind}`,
    })
  } else if (kind === 'ARCHIVE') {
    await transitionElection({
      actorId: opts.approverId,
      electionId: (await pool.query<{ election_id: string }>('SELECT election_id FROM admin_actions WHERE id = $1', [opts.actionId])).rows[0]?.election_id ?? '',
      to: 'ARCHIVED',
      reason: 'Diarsipkan',
    })
  }
  return { status: 'APPROVED' }
}

export async function rejectAction(opts: { approverId: string; actionId: string }) {
  const pool = getPool()
  const { rowCount } = await pool.query(
    "UPDATE admin_actions SET status = 'REJECTED', approver_id = $2, decided_at = clock_timestamp() WHERE id = $1 AND status = 'PENDING' AND proposer_id <> $2",
    [opts.actionId, opts.approverId],
  )
  if (rowCount === 0) apiError('STATE_INVALID', 'Aksi tidak dapat ditolak (status berubah atau pengusul sama).')
  return { status: 'REJECTED' }
}
