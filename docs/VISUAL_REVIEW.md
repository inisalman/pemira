# Catatan tinjauan visual PEMIRA — PH-1

Tanggal: 14 September 2026 · Task P1-06

## Pemeriksaan kontras aktual (WCAG 2.x, perhitungan luminans relatif)

Semua kombinasi warna token yang benar-benar dipakai antarmuka:

| Kombinasi | Rasio | Minimum AA | Hasil |
| --- | --- | --- | --- |
| Teks utama di latar `#FFF9F2` | 12.94 | 4.5 | Lulus |
| Teks utama di permukaan putih | 13.53 | 4.5 | Lulus |
| Teks sekunder (`--color-text-muted`) di latar | 5.34 | 4.5 | Lulus |
| Teks sekunder di permukaan putih | 5.58 | 4.5 | Lulus |
| Tautan/aksi `#2A6B5C` di latar | 5.98 | 4.5 | Lulus |
| Teks putih di tombol `#2A6B5C` | 6.26 | 4.5 | Lulus |
| Teks putih di tombol hover `#1F5145` | 9.05 | 4.5 | Lulus |
| Danger di `--color-danger-bg` | 5.11 | 4.5 | Lulus |
| Success di `--color-success-bg` | 4.66 | 4.5 | Lulus |
| Warning di `--color-warning-bg` | 5.01 | 4.5 | Lulus |
| Info di `--color-info-bg` | 5.85 | 4.5 | Lulus |

## Pemeriksaan struktural

- Semua halaman merespons HTTP 200: `/`, `/login`, `/voter`, `/admin`, `/quick-count/test`.
- Font Inter termuat dari aset lokal (`@fontsource-variable/inter`, `font-display: swap`), tanpa CDN eksternal; fallback `system-ui` menjaga keterbacaan sebelum termuat.
- Status tidak bergantung pada warna: AppAlert memakai ikon (ℹ/✓/⚠) + teks; tombol disabled memakai opacity + `cursor: not-allowed`; loading memakai spinner + `aria-busy`.
- Fokus keyboard: `:focus-visible` global dengan ring hijau 2px; input memakai `aria-invalid` + `aria-describedby` untuk pesan error; dialog memakai `role="alertdialog"` + `aria-modal` + Esc untuk menutup.
- Label form terkait via `for`/`id`; tabel memakai `scope="col"` dan caption; pagination memakai `aria-label="Navigasi halaman"`.
- `prefers-reduced-motion` menghentikan animasi.

## Pemeriksaan 360 px dan desktop

Struktur CSS menggunakan grid/flex dengan breakpoint 48rem untuk nav admin; max-width konten 72rem desktop. Verifikasi piksel pada perangkat nyata/preview browser dilakukan pada titik tinjau PH-1 bersama pemilik proyek karena pemeriksaan otomatis tidak dapat menggantikan peninjauan visual manusia.

## Yang masih terbuka

- Pemeriksaan pembaca layar (VoiceOver/NVDA) menyeluruh menunggu halaman terhubung data nyata (PH-5/PH-7).
- Preview sintetis ditandai eksplisit di halaman login/voter/quick-count/results/admin.
