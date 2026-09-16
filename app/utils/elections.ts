export function electionStatus(status: string): string {
  return ({ READY: 'Belum dibuka', OPEN: 'Pemilihan dibuka', PAUSED: 'Pemilihan dijeda', CLOSED: 'Pemilihan ditutup', PUBLISHED: 'Hasil telah ditetapkan' } as Record<string, string>)[status] ?? 'Belum tersedia'
}

export function electionDate(value: string | null): string {
  if (!value) return 'Belum ditentukan'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value)) + ' WIB'
}
