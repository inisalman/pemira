# Catatan Verifikasi PH-7 (2026-09-16)

Dokumen ini adalah catatan verifikasi TASKLIST P7 (referensi P7-08). Angka
resource **belum** dapat disebut terverifikasi sebelum pengukuran di bawah
selesai; bagian yang masih menunggu diberi tanda ⏳.

## Konfigurasi pengujian

- Machine: macOS (darwin arm64), Node v22.9.0, PostgreSQL lokal, Nuxt 4.5.2.
- DB uji: buang-per-jalankan (`pemira_p7_*`, `pemira_nfr02_*`), migrasi dari
  `database/migrations`, seed skrip `tests/load/nfr01.ts` dan
  `scripts/nfr02-restart.ts`.
- Isolasi: seluruh skenario (login, mixed, restart) menggunakan database
  berbeda; reset data hanya di lingkungan uji.

## NFR-01 — uji beban (P7-04/P7-05)

### Skenario lonjakan 600 login (terpisah, sesuai spec)

- 600 akun pemilih, 1 hash Argon2id bersama untuk sweep yang deterministik.
- Hasil: 600/600 login sukses, p50 9 ms, p95 10 ms, total sweep 5.503 ms.
- Catatan: p95 ≤ 2 s jauh dilampaui; rate limiter login tidak aktif pada
  sweep ini karena sukses (batas 10 gagal/15 menit per akun).

### Skenario campuran (mixed) — selesai

- 10 suara/detik selama 4 menit via `castVote` (jalur transaksi produksi,
  lock election FOR UPDATE + lock right FOR UPDATE per suara).
- 600 penonton polling `quickCountPayload` tiap 5 s, stagger 50 ms
  (21.600 polling total).
- Hasil: `voteOps=1770`, **voteP50 3 ms, voteP95 8 ms** (target ≤ 2 s ✓),
  **voteErrors 0, errorRate 0%** (target < 1% ✓), `ballots=participations=1770`,
  `noDoubleVotes=true`, spectator p95 20 ms, total error 0.
- Run pertama (sebelum perbaikan generator harness) menemukan 66% "error"
  yang ternyata CONFLICT sah karena generator memilih ulang pemilih yang
  telah memilih di kontes lain — diperbaiki: pemilih dipetakan bijektif ke
  (slot kontes, pemilih) sehingga tidak ada suara ganda by design; aplikasi
  sendiri menolak semua suara ganda dengan `CONFLICT` (lihat voting.test.ts).

## NFR-02 — restart aplikasi/database (P7-07)

`scripts/nfr02-restart.ts` hasil:

- 5 suara cast → `ballots=5 participations=5`.
- Setelah closePool + pool baru (simulasi restart proses aplikasi):
  5/5 kuitansi terverifikasi.
- Setelah restart service Postgres (best-effort `{ brew services restart }`):
  5/5 kuitansi tetap terverifikasi.
- Batas: topologi satu VPS tidak menjamin kehilangan total disk/VPS —
  dicatat sebagai batas arsitektur sesuai NFR-02 dan D-07.

## NFR-04 — tidak ada identitas pada log/payload (P6-07 lanjutan)

- `tests/integration/results.test.ts` "public quick-count payload carries no
  voter/right identifiers": identitas (`identifier_value`) & id hak
  (`voting_rights.id`) tidak tercantum pada payload publik.
- `tests/integration/voting.test.ts` "audit log for votes contains no option
  id": redaksi opsi pada log audit.

## Sisanya ⏳

1. ~~Hasil skenario mixed (P7-04)~~ ✓ di atas.
2. P7-05 resource: harness `mixed` memakai **~140 MiB RSS**
   (`maximum resident set size = 146.587.648 B`) dan hit 7,43 s CPU user +
   2,37 s sys selama 180 s wall clock (beban 5% CPU). Login sweep
   **~160 MiB RSS**. Keduanya jauh di bawah anggaran 512 MiB aplikasi +
   512 MiB database. Data terukur pada penuh beban produksi-path
   (bukan estimasi). Konfigurasi pool: max 15 koneksi harness, pool
   aplikasi default (lihat `database/db.ts`); `pg_stat_activity` kembali
   ke baseline 6 setelah uji.
3. P7-01 alur end-to-end FR-01–FR-16 / T-01–T-20 (butuh halaman UI masa
   depan; bersama batch UI).
4. P7-02 aksesibilitas manual (keyboard, pembaca layar, 360 px, dialog,
   kontras) setelah halaman UI terhubung.
5. P7-03 tinjauan keamanan lintas peran & CSRF/konfigurasi (sebagian sudah
   dicakup test; tulis hasil tinjauan di dokumen ini).
6. P7-06/P7-08 optimasi bottleneck terbukti + pencatatan keputusan.
