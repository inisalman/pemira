import { randomUUID } from 'node:crypto'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { getPool } from '../../../database/db'
import { apiError } from '../../utils/errors'
import { recordAuditEvent } from '../audit/audit'

const MAX_BYTES = 5 * 1024 * 1024
const storageRoot = () => process.env.NUXT_UPLOAD_DIR || join(process.cwd(), 'storage', 'candidate-photos')

export async function updateCandidatePhoto(actorId: string, optionId: string, data: Buffer, filename: string) {
  if (!data.length || data.length > MAX_BYTES) apiError('VALIDATION_ERROR', 'Foto wajib diisi dan maksimal berukuran 5 MB.')
  if (!/\.(jpe?g|png|webp)$/i.test(filename)) apiError('VALIDATION_ERROR', 'Format foto harus JPG, PNG, atau WebP.')
  let image
  try { image = sharp(data, { limitInputPixels: 20_000_000 }) } catch { apiError('VALIDATION_ERROR', 'Berkas foto tidak valid.') }
  const metadata = await image!.metadata().catch(() => null)
  if (!metadata?.format || !['jpeg', 'png', 'webp'].includes(metadata.format)) apiError('VALIDATION_ERROR', 'Berkas foto tidak valid.')
  if (!metadata.width || !metadata.height) apiError('VALIDATION_ERROR', 'Dimensi foto tidak dapat dibaca.')
  const processed = await image!.rotate().resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toBuffer().catch(() => null)
  if (!processed) apiError('VALIDATION_ERROR', 'Foto tidak dapat diproses.')

  const pool = getPool()
  const client = await pool.connect()
  let oldKey: string | null = null
  const key = `${randomUUID()}.webp`
  try {
    await client.query('BEGIN')
    const { rows } = await client.query<{ photo_key: string | null; election_id: string; status: string }>(
      `SELECT o.photo_key, c.election_id, e.status FROM candidate_options o JOIN contests c ON c.id = o.contest_id JOIN elections e ON e.id = c.election_id WHERE o.id = $1 FOR UPDATE OF e`, [optionId],
    )
    const option = rows[0]
    if (!option) apiError('NOT_FOUND', 'Opsi calon tidak ditemukan.')
    if (option.status !== 'DRAFT') apiError('STATE_INVALID', 'Foto hanya dapat diubah saat DRAFT.')
    oldKey = option.photo_key
    await mkdir(storageRoot(), { recursive: true })
    await writeFile(join(storageRoot(), key), processed!)
    await client.query('UPDATE candidate_options SET photo_key = $2 WHERE id = $1', [optionId, key])
    await recordAuditEvent(client, { actorId, electionId: option.election_id, action: 'ADMIN_UPDATE_CANDIDATE_PHOTO', target: optionId, changes: { format: 'webp', bytes: processed!.length } })
    await client.query('COMMIT')
    if (oldKey) await unlink(join(storageRoot(), oldKey)).catch(() => undefined)
    return { photoKey: key }
  } catch (err) {
    await client.query('ROLLBACK')
    await unlink(join(storageRoot(), key)).catch(() => undefined)
    throw err
  } finally { client.release() }
}

export function candidatePhotoPath(key: string) {
  if (!/^[a-zA-Z0-9-]+\.webp$/.test(key)) return null
  return join(storageRoot(), key)
}
