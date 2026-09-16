import { randomUUID } from 'node:crypto'
import { apiError } from '../../utils/errors'
import { getPool } from '../../../database/db'
import { recordAuditEvent } from '../audit/audit'
import { lockElection } from './state'

/**
 * Contest and candidate management per SDD sections 3/8 (TASKLIST P3-02/P3-04).
 * PAIR contests require exactly one CHAIR + one VICE_CHAIR member; SINGLE
 * contests exactly one member whose position matches the office.
 * Mutations are allowed only in DRAFT and audited.
 */

function assertDraft(status: string): void {
  if (status !== 'DRAFT') apiError('STATE_INVALID', 'Perubahan hanya dilakukan saat DRAFT.')
}

export async function createContest(opts: {
  actorId: string
  electionId: string
  code: string
  title: string
  office: 'PAIR' | 'CHAIR' | 'VICE_CHAIR'
  optionType: 'PAIR' | 'SINGLE'
  scopeDepartmentId?: string | null
}) {
  const pool = getPool()
  if (opts.office === 'PAIR' && opts.optionType !== 'PAIR') {
    apiError('VALIDATION_ERROR', 'Kontes PAIR harus bertipe PAIR.')
  }
  if (opts.office !== 'PAIR' && opts.optionType !== 'SINGLE') {
    apiError('VALIDATION_ERROR', 'Kontes ketua/wakil harus bertipe SINGLE.')
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const election = await lockElection(client, opts.electionId)
    assertDraft(election.status)
    // Resolve department by UUID or code so callers can pass either.
    let scopeDepartmentId = opts.scopeDepartmentId ?? null
    if (scopeDepartmentId) {
      const dept = await client.query<{ id: string }>(
        'SELECT id FROM departments WHERE id = $1 OR code = $1', [scopeDepartmentId])
      if (dept.rowCount === 0) apiError('VALIDATION_ERROR', 'Departemen tidak ditemukan.')
      scopeDepartmentId = dept.rows[0]!.id
    }
    const id = randomUUID()
    await client.query(
      'INSERT INTO contests (id, election_id, code, title, scope_department_id, office, option_type) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, opts.electionId, opts.code, opts.title, scopeDepartmentId, opts.office, opts.optionType],
    )
    await recordAuditEvent(client, {
      actorId: opts.actorId,
      electionId: opts.electionId,
      action: 'ADMIN_CREATE_CONTEST',
      target: id,
      changes: { code: opts.code, office: opts.office },
    })
    await client.query('COMMIT')
    return { id }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function createCandidateOption(opts: {
  actorId: string
  contestId: string
  number: number
  members: { name: string; position: 'CHAIR' | 'VICE_CHAIR' }[]
  motto?: string
  vision?: string
  mission?: string
  programs?: string
}) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Lock the contest's election via join to check DRAFT atomically.
    const { rows } = await client.query<{ status: string; option_type: string; office: string; election_id: string }>(
      `SELECT e.status, c.option_type, c.office, c.election_id
       FROM contests c JOIN elections e ON e.id = c.election_id
       WHERE c.id = $1 FOR UPDATE OF e`,
      [opts.contestId],
    )
    const contest = rows[0]
    if (!contest) apiError('NOT_FOUND', 'Kontes tidak ditemukan.')
    assertDraft(contest.status)

    // Member count/position rules per option type
    if (contest.option_type === 'PAIR') {
      if (opts.members.length !== 2) apiError('VALIDATION_ERROR', 'Pasangan wajib memiliki ketua dan wakil.')
      const positions = opts.members.map((m) => m.position).sort()
      if (positions[0] !== 'CHAIR' || positions[1] !== 'VICE_CHAIR') {
        apiError('VALIDATION_ERROR', 'Pasangan wajib tepat satu ketua dan satu wakil.')
      }
    } else {
      if (opts.members.length !== 1) apiError('VALIDATION_ERROR', 'Kontes SINGLE wajib tepat satu calon.')
      const expected = contest.office === 'CHAIR' ? 'CHAIR' : 'VICE_CHAIR'
      if (opts.members[0]?.position !== expected) {
        apiError('VALIDATION_ERROR', `Posisi calon harus ${expected}.`)
      }
    }

    // Duplicate number in same contest → friendly ApiError instead of DB error.
    const dup = await client.query('SELECT id FROM candidate_options WHERE contest_id = $1 AND number = $2', [opts.contestId, opts.number])
    if (dup.rows.length > 0) apiError('VALIDATION_ERROR', 'Nomor urut sudah dipakai di kontes ini.')

    const optionId = randomUUID()
    await client.query(
      'INSERT INTO candidate_options (id, contest_id, number, motto, vision, mission, programs) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [optionId, opts.contestId, opts.number, opts.motto ?? null, opts.vision ?? null, opts.mission ?? null, opts.programs ?? null],
    )
    for (const m of opts.members) {
      await client.query(
        'INSERT INTO candidate_members (id, option_id, name, position) VALUES ($1,$2,$3,$4)',
        [randomUUID(), optionId, m.name, m.position],
      )
    }
    await recordAuditEvent(client, {
      actorId: opts.actorId,
      electionId: contest.election_id,
      action: 'ADMIN_CREATE_CANDIDATE',
      target: optionId,
      changes: { contestId: opts.contestId, number: opts.number },
    })
    await client.query('COMMIT')
    return { id: optionId }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function updateCandidateOption(opts: {
  actorId: string
  optionId: string
  number?: number
  members?: { name: string; position: 'CHAIR' | 'VICE_CHAIR' }[]
  motto?: string
  vision?: string
  mission?: string
  programs?: string
}) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query<{ status: string; election_id: string }>(
      `SELECT e.status, c.election_id
       FROM candidate_options o JOIN contests c ON c.id = o.contest_id
       JOIN elections e ON e.id = c.election_id
       WHERE o.id = $1 FOR UPDATE OF e`,
      [opts.optionId],
    )
    const option = rows[0]
    if (!option) apiError('NOT_FOUND', 'Opsi calon tidak ditemukan.')
    assertDraft(option.status)

    await client.query(
      `UPDATE candidate_options SET
         number = COALESCE($2, number),
         motto = COALESCE($3, motto),
         vision = COALESCE($4, vision),
         mission = COALESCE($5, mission),
         programs = COALESCE($6, programs)
       WHERE id = $1`,
      [opts.optionId, opts.number ?? null, opts.motto ?? null, opts.vision ?? null, opts.mission ?? null, opts.programs ?? null],
    )
    if (opts.members) {
      await client.query('DELETE FROM candidate_members WHERE option_id = $1', [opts.optionId])
      for (const m of opts.members) {
        await client.query(
          'INSERT INTO candidate_members (id, option_id, name, position) VALUES ($1,$2,$3,$4)',
          [randomUUID(), opts.optionId, m.name, m.position],
        )
      }
    }
    await recordAuditEvent(client, {
      actorId: opts.actorId,
      electionId: option.election_id,
      action: 'ADMIN_UPDATE_CANDIDATE',
      target: opts.optionId,
    })
    await client.query('COMMIT')
    return { status: 'OK' }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
