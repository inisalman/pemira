# PEMIRA

PEMIRA adalah aplikasi e-voting kampus untuk mahasiswa dan dosen Poltekkes Jakarta 1. Project ini merupakan rewrite dari aplikasi PHP/CodeIgniter yang sebelumnya dipakai setiap tahun menjadi satu aplikasi Nuxt yang dapat digunakan ulang untuk banyak periode pemilihan.

## Status

Fitur inti MVP sudah tersedia dan teruji: autentikasi, DPT, import pemilih, kandidat, upload foto, hak pilih, voting transaksional, quick count, statistik, audit, export, dan kontrol periode.

Project belum dinyatakan siap untuk pemilihan riil sebelum migrasi data, backup/restore eksternal, deployment, dan simulasi bersama panitia selesai.

## Fitur

- Login pemilih melalui `/login` untuk mahasiswa (NIM) dan dosen (NIP lokal).
- Login panitia/admin melalui `/admin`.
- Periode dengan status `DRAFT`, `READY`, `OPEN`, `PAUSED`, `CLOSED`, dan `PUBLISHED`.
- Sepuluh kontes awal: BEM, MPM, serta ketua/wakil Hima per jurusan.
- Kandidat PAIR dan SINGLE dengan nomor urut, moto, visi, misi, program, dan foto.
- DPT manual atau import XLSX/CSV dengan preview dan laporan per baris.
- Hak pilih default dan penyesuaian individual/massal berbasis kontes.
- Voting satu opsi per kontes dengan transaksi atomik dan idempotensi.
- Receipt digital tanpa identitas calon pada kode tanda terima.
- Quick count publik dengan cache dan indikator data kedaluwarsa.
- Snapshot hasil resmi berversi, checksum, rekonsiliasi, dan publikasi terpisah.
- Statistik, export agregat, audit append-only, dan kontrol operasional panitia.

## Arsitektur

Satu project full-stack:

```text
app/                 Halaman Vue, layout, komponen, dan middleware
server/api/v1/       Endpoint Nitro yang memeriksa sesi, CSRF, dan role
server/services/     Layanan domain untuk voting, DPT, kandidat, hasil, audit
database/            Migrasi SQL, koneksi PostgreSQL, dan seed sintetis
shared/              Tipe yang dipakai bersama
docs/                PRD, SDD, tasklist, operasi, dan verifikasi
```

Nuxt menggunakan `ssr: false` untuk halaman aplikasi. Nitro tetap menjalankan API pada build production. PostgreSQL menjadi sumber state otoritatif; suara dan hak pilih tidak disimpan di memory proses.

## Kebutuhan lokal

| Kebutuhan | Versi |
| --- | --- |
| Node.js | `^22.19.0` atau `^24.11.0` atau lebih baru |
| PostgreSQL | 16+ untuk lokal, 17 untuk target produksi |
| npm | 11+ |

## Menjalankan lokal

1. Siapkan database PostgreSQL kosong.
2. Salin konfigurasi: `cp .env.example .env`.
3. Isi `NUXT_DATABASE_URL`, `NUXT_SESSION_SECRET`, dan `DATABASE_URL` di `.env`. Jangan commit `.env`.
4. Jalankan migrasi:

   ```bash
   npx tsx database/migrate.ts
   ```

5. Untuk data sintetis pengembangan, jalankan `npx tsx database/seed.ts`. Seed membuat empat jurusan, sepuluh kontes, dan sekitar 600 pemilih sintetis. Jangan jalankan seed pada database produksi.
6. Jalankan server dengan `npm run dev`, lalu buka `http://localhost:3000`.

## Environment variable

| Variable | Kegunaan |
| --- | --- |
| `NUXT_DATABASE_URL` | Connection string PostgreSQL untuk server |
| `NUXT_SESSION_SECRET` | Secret sesi server |
| `NUXT_PUBLIC_APP_NAME` | Nama aplikasi yang aman ditampilkan di browser |
| `DATABASE_URL` | Connection string untuk tool migrasi dan seed |
| `NUXT_UPLOAD_DIR` | Direktori volume foto kandidat; default `storage/candidate-photos` |

## Perintah penting

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Server development |
| `npm run build` | Build production Nitro node-server |
| `npm run start` | Menjalankan hasil build production |
| `npm run preview` | Preview build production |
| `npm run typecheck` | Pemeriksaan TypeScript/Vue |
| `npm test -- --run` | Unit dan integration test |

Integration test membuat database sementara melalui PostgreSQL. Pastikan user database memiliki izin membuat dan menghapus database uji.

## Keamanan dan integritas suara

- Password di-hash dengan Argon2id dan tidak pernah dikembalikan ulang.
- Cookie sesi HttpOnly/SameSite, token sesi disimpan dalam bentuk hash, dan sesi dapat dicabut saat reset password.
- Request yang mengubah state membutuhkan CSRF double-submit token.
- API selalu memeriksa autentikasi dan otorisasi di server.
- Voting mengunci periode dan hak pilih dalam satu transaksi database.
- Constraint database mencegah hak atau opsi tertukar antarperiode/kontes.
- `ballots` tidak memiliki hubungan langsung ke identitas pemilih.
- Audit tidak menyimpan password, token, payload pilihan, atau isi DPT lengkap.
- Foto kandidat di-re-encode ke WebP, dibatasi ukurannya, dan metadata EXIF dibersihkan.

Model ini membatasi akses aplikasi, tetapi belum menjamin anonimitas terhadap administrator database yang dapat mengakses metadata transaksi dan backup. Baca batasan tersebut di `docs/SDD.md` sebelum deployment nyata.

## Deployment

Target deployment adalah Node.js Nitro server di VPS melalui EasyPanel, dengan PostgreSQL dan volume foto yang persisten. Gunakan `Dockerfile` untuk image production.

Sebelum go-live, gunakan Node versi yang sesuai engine Nuxt, isi secret melalui environment, pasang volume persisten untuk database dan `NUXT_UPLOAD_DIR`, konfigurasi HTTPS/health check `GET /`, siapkan backup luar VPS dan uji restore, serta jangan menjalankan migrasi saat voting aktif.

## Dokumentasi

- [Roadmap rewrite](plan.md)
- [PRD](docs/PRD.md)
- [SDD](docs/SDD.md)
- [Tasklist](docs/TASKLIST.md)
- [Panduan operasi panitia](docs/OPERATIONS.md)
- [Catatan verifikasi](docs/VERIFICATION.md)
- [Keputusan proyek](docs/DECISIONS.md)

## Lisensi

Lisensi belum ditetapkan. Tambahkan lisensi sebelum repository dipublikasikan untuk penggunaan di luar organisasi.
