# Panduan Operator & Panitia PEMIRA (P8-07)

Referensi: PRD bagian 11, SDD bagian 11. Terakhir diperbarui: 2026-09-16.

## 1. Operasi harian

- Login dashboard admin: `POST /api/v1/auth/login` dengan jenis akun Panitia.
- Monitoring: `GET /api/v1/admin/elections/:id` untuk status periode; log
  aplikasi berada di stdout container aplikasi EasyPanel (rotasi oleh Log
  Rotate bawaan; retensi mengikuti D-09 setelah disahkan).
- Health check: EasyPanel HTTP probe ke `GET /` (200). DB liveness via
  panel service Postgres.

## 2. Alur panitia end-to-end (P8-06 checklist)

1. Masukkan jurusan/kontes/calons saat periode DRAFT (edit terkunci setelahnya).
2. Impor DPT: unduh template `GET /api/v1/admin/voters/template`, isi sheet
   DATA (VOTER_TYPE/IDENTIFIER_TYPE/IDENTIFIER_VALUE/NAME/DEPARTMENT_CODE),
   unggah `POST /api/v1/admin/voters/import` → tinjau error → COMMIT.
3. Distribusi password awal: `POST /api/v1/admin/voters/:id/issue` (kredensial
   dicetak sekali; tidak tersimpan plaintext).
4. Hak pilih: `GET/POST /api/v1/admin/elections/:id/rights` (DEFAULT otomatis;
   ADMIN untuk pengecualian).
5. READY → dua akun panitia berbeda menyetujui OPEN (alur actions approve).
6. Voting: pemilih login → dashboard kontes → kirim → simpan kuitansi.
7. Jeda (PAUSED) tidak menghapus suara; pulihkan via approve dua akun.
8. Closed → snapshot resmi (rekonsiliasi otomatis) → PUBLISHED.
9. Gangguan: jangan buka ulang periode CLOSED (D-13); eskalasi ke pj. teknis.

## 3. Impor bermasalah

- `POST .../voters/import` menolak file > 2 MB, non-xlsx, formula, > 2000 baris.
- Baris CONTOH di template dilewati otomatis.
- Kegagalan VALIDATED → kirim ulang file baru; batch lama tetap terpisah.
- Re-import mempertahankan `password_hash` lama (jangan reset tanpa sengaja).

## 4. Backup / restore (P8-04)

- Tujuan luar VPS: DISKUSI — jadwal, retensi, dan penanggung jawab di D-09
  (wajib disahkan sebelum data riil).
- Restore hanya di lingkungan terisolasi. Larangan: meneruskan restore yang
  menghilangkan suara terkonfirmasi tanpa keputusan panitia.
- `scripts/nfr02-restart.ts` membuktikan suara tetap selamat setelah restart
  aplikasi/DB.

## 5. Reset akses

- Reset password admin: `POST /api/v1/admin/users/:id/reset-password`
  (memerlukan autentikasi ulang password petugas).
- Pemilih: issue ulang password via import pipeline tanpa menyentuh hash.

## 6. Eskalasi insiden

1. Cek status & audit: dashboard admin → audit page.
2. Selisih suara → jalankan rekonsiliasi (action SNAPSHOT membantu lapor).
3. Keputusan mengulang pemilihan = wewenang panitia (D-13), bukan operator.

## 7. Catatan deploy (P8-02/P8-03)

- Image dibangun di mesin CI luar VPS (Dockerfile multi-stage, non-root).
- Runtime Node: **≥ 22.12 / ≥ 24.11** diperlukan (require(esm) untuk
  oxc-parser yang dipakai tree-shake Nuxt). Node 22.9 gagal build.
- Secrets memakai env-namespace `NUXT_*`; jangan dicetak ke log.
- Volume foto kandidat & data Postgres wajib persistent volume EasyPanel.
