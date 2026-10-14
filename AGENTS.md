# Catatan untuk AI Agent — PEMIRA

File ini dibaca oleh agent AI (lokal maupun yang berjalan di VPS produksi) agar
konsisten saat mengubah atau mengoperasikan PEMIRA. Tulis instruksi di sini,
**bukan rahasia**.

> ⚠️ **JANGAN pernah menuliskan nilai rahasia di file ini atau file mana pun di
> repo.** Yang boleh: NAMA environment variable dan prosedur. Yang dilarang:
> nilai `NUXT_SESSION_SECRET`, connection string berisi password, password
> admin, API key, host/IP produksi. File ini publik di Git — anggap semua
> isinya bisa dibaca siapa saja.

## Konteks singkat

PEMIRA = aplikasi e-voting kampus (Nuxt full-stack, `ssr: false`, Nitro API,
PostgreSQL). PostgreSQL adalah sumber state otoritatif; suara & hak pilih tidak
disimpan di memory proses. Detail arsitektur ada di `README.md` dan `docs/SDD.md`.

## Aturan yang tidak boleh dilanggar (integritas suara)

1. **`ballots` harus tetap bebas identitas.** Jangan tambahkan kolom
   `voter_id`, `right_id`, `receipt_code`, atau waktu presisi ke tabel
   `ballots`. Ini invariant anonimitas (SDD section 3).
2. **Jangan menautkan receipt ke identitas di tempat yang bisa dibaca admin DB.**
   Audit `VOTE_CAST` sengaja TIDAK menyimpan `receipt_code` — jangan tambahkan
   lagi. `receipt` sudah masuk pola redaksi di `server/services/audit/audit.ts`
   dan `server/utils/log-redaction.ts`.
3. **Semua request pengubah state wajib `requireCsrf(event)`** setelah
   `requireSession`/`requireAdmin`. Login dikecualikan (belum ada sesi).
4. **Voting berjalan dalam satu transaksi dengan row-lock** (`FOR UPDATE`).
   Jangan memecah langkah lock/cek/insert di `server/services/voting/ballots.ts`.
5. **Jangan jalankan migrasi saat periode `OPEN`.** Lihat `docs/OPERATIONS.md`.
6. **Jangan pernah log/return** password, token sesi, hash, identifier lengkap,
   isi DPT, option_id pilihan, atau receipt. Gunakan helper redaksi yang ada.

## Deployment produksi (VPS / EasyPanel)

Konfigurasi lewat environment variable (lihat `.env.example` untuk daftar &
format — isi NILAI hanya di panel/secret store VPS, bukan di repo):

| Variable | Keterangan |
| --- | --- |
| `NUXT_DATABASE_URL` | Connection string PostgreSQL server. Rahasia. |
| `NUXT_SESSION_SECRET` | Secret sesi. Rahasia. Generate acak, jangan dibagikan. |
| `NUXT_TRUSTED_PROXY_COUNT` | Jumlah hop reverse-proxy tepercaya di depan app. |
| `NUXT_UPLOAD_DIR` | Direktori volume foto kandidat (persistent). |
| `NUXT_PUBLIC_APP_NAME` | Nama app yang aman tampil di browser. |

### WAJIB diperhatikan saat deploy

- **`NUXT_TRUSTED_PROXY_COUNT` harus cocok dengan topologi proxy.**
  - `0` (default) = app terekspos langsung; `X-Forwarded-For` diabaikan (anti-spoof).
  - `1` = satu proxy tepercaya (umum: EasyPanel/nginx yang terminasi TLS).
  - Jika app di belakang proxy tapi dibiarkan `0`, SEMUA request terlihat dari
    IP proxy yang sama → rate-limit IP bisa salah mengunci seluruh kampus.
  - Jika terlalu tinggi, klien bisa men-spoof IP untuk melewati rate-limit.
- Volume Postgres dan `NUXT_UPLOAD_DIR` wajib **persistent**.
- HTTPS + health check `GET /` (200).
- Runtime Node sesuai engine Nuxt (lihat `docs/OPERATIONS.md` §7).
- Siapkan backup di luar VPS dan uji restore sebelum data riil.

## Verifikasi sebelum menyatakan selesai

- `npm run typecheck` harus lolos.
- `npm test -- --run` menjalankan unit + integration test. Integration test
  butuh PostgreSQL dengan izin membuat/menghapus database uji (perlu `psql` di
  PATH). Jika `psql` tidak tersedia, minimal jalankan `npm test -- --run tests/unit`.

## Rujukan

- `docs/OPERATIONS.md` — runbook panitia & operator (end-to-end).
- `docs/SDD.md` — desain sistem & invariant keamanan.
- `README.md` — ikhtisar, cara menjalankan lokal, batasan keamanan.
