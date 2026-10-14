/**
 * build-riwayat.ts — generator arsip riwayat PEMIRA (dev-only).
 *
 * Membaca export CSV log voting sistem lama (Laravel), menjalankan validasi
 * ketat sesuai docs/SPEC-riwayat.md bagian 4, lalu menulis agregat bersih
 * (tanpa PII) ke app/data/riwayat.json yang di-commit ke repo.
 *
 * Pemakaian:
 *   npx tsx scripts/build-riwayat.ts /path/ke/riwayat_memilih.csv
 *
 * CSV mentah TIDAK boleh masuk repo — simpan di luar (lokal/secret store).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

type Period = {
  id: string
  name: string
  organizer: string
  year: string
  votingStart: string
  votingEnd: string
}

/** Daftar periode lama yang diarsipkan. Tambah entri di sini kalau ada export baru. */
const PERIODS: Period[] = [
  { id: 'pemira-2025', name: 'PEMIRA 2025', organizer: 'BEM', year: '2025', votingStart: '2026-02-09', votingEnd: '2026-02-16' },
]

const NIM_RE = /^P?p?(\d{11,12})$/i
const TIME_RE = /^(\d{4}-\d{2}-\d{2}) - (\d{2}:\d{2}:\d{2})$/

function inWindow(isoDate: string, period: Period): boolean {
  return isoDate >= period.votingStart && isoDate <= period.votingEnd
}

function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error('Pemakaian: npx tsx scripts/build-riwayat.ts <csv-path>')
    process.exit(1)
  }

  const lines = readFileSync(resolve(csvPath), 'utf8').split(/\r?\n/).filter(Boolean)
  const [header, ...rows] = lines
  if (!header.startsWith('id,')) {
    console.error('Format CSV tidak dikenal — header pertama harus "id,nim_username,waktu_memilih,pesan".')
    process.exit(1)
  }

  // { periodId -> { nim -> date } } untuk dedup per NIM per periode
  const votes = new Map<string, Map<string, string[]>>()
  for (const period of PERIODS) votes.set(period.id, new Map())

  let seen = 0
  let invalid = 0
  let outsideWindow = 0
  for (const line of rows) {
    const cols = line.split(',')
    if (cols.length < 3) continue
    seen += 1
    const nimMatch = NIM_RE.exec(cols[1]?.trim() ?? '')
    const timeMatch = TIME_RE.exec(cols[2]?.trim() ?? '')
    if (!nimMatch || !timeMatch) { invalid += 1; continue }
    const nim = nimMatch[1]
    const date = timeMatch[1]
    const period = PERIODS.find(p => inWindow(date, p))
    if (!period) { outsideWindow += 1; continue }
    const perNim = votes.get(period.id)!
    const days = perNim.get(nim) ?? []
    days.push(date)
    perNim.set(nim, days)
  }

  const output = {
    periods: PERIODS.map((period) => {
      const perNim = votes.get(period.id)!
      const daily: { date: string; votes: number }[] = []
      const cursor = new Date(`${period.votingStart}T00:00:00Z`)
      const end = new Date(`${period.votingEnd}T00:00:00Z`)
      while (cursor <= end) {
        const date = cursor.toISOString().slice(0, 10)
        daily.push({ date, votes: 0 })
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
      for (const days of Array.from(perNim.values())) {
        for (const date of days) {
          const slot = daily.find(d => d.date === date)
          if (slot) slot.votes += 1
        }
      }
      const validVotes = daily.reduce((sum, d) => sum + d.votes, 0)
      const votingDays = daily.length
      return {
        id: period.id,
        name: period.name,
        organizer: period.organizer,
        year: period.year,
        votingStart: period.votingStart,
        votingEnd: period.votingEnd,
        stats: { validVotes, uniqueVoters: perNim.size, votingDays },
        daily,
        notes: `Data arsip sistem sebelumnya; validasi ketat ${validVotes} dari ${seen} baris tercatat.`,
        results: null,
      }
    }),
  }

  const outPath = resolve('app/data/riwayat.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`)
  for (const p of output.periods) {
    console.log(`${p.id}: ${p.stats.validVotes} vote valid, ${p.stats.uniqueVoters} NIM unik, ${p.stats.votingDays} hari (invalid: ${invalid}, di luar jendela: ${outsideWindow})`)
  }
  console.log(`Ditulis: ${outPath}`)
}

main()
