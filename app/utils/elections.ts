export function electionStatus(status: string): string {
  return ({ READY: 'Belum dibuka', OPEN: 'Pemilihan dibuka', PAUSED: 'Pemilihan dijeda', CLOSED: 'Pemilihan ditutup', PUBLISHED: 'Hasil telah ditetapkan' } as Record<string, string>)[status] ?? 'Belum tersedia'
}

export function electionDate(value: string | null): string {
  if (!value) return 'Belum ditentukan'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value)) + ' WIB'
}

// Derive a short badge mark and group label from a contest title, mirroring the
// landing portal category marks (KP/KB/KG/OP for HIMA jurusan, BEM, MPM).
export function contestMark(title: string): { mark: string; group: string } {
  const value = title.toLowerCase()
  if (value.includes('bem')) return { mark: 'BEM', group: 'Eksekutif kampus' }
  if (value.includes('mpm')) return { mark: 'MPM', group: 'Legislatif mahasiswa' }
  const jurusan: { match: string; mark: string }[] = [
    { match: 'keperawatan', mark: 'KP' },
    { match: 'kebidanan', mark: 'KB' },
    { match: 'gigi', mark: 'KG' },
    { match: 'ortotik', mark: 'OP' },
    { match: 'prostetik', mark: 'OP' },
  ]
  const hit = jurusan.find(j => value.includes(j.match))
  if (hit) return { mark: hit.mark, group: 'Himpunan Mahasiswa' }
  if (value.includes('hima')) return { mark: 'HIMA', group: 'Himpunan Mahasiswa' }
  // Fallback: initials from the first two significant words.
  const initials = title.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]?.toUpperCase() ?? '').join('')
  return { mark: initials || 'KT', group: 'Kontes pemilihan' }
}
