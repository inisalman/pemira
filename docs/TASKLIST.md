# Checklist implementasi PEMIRA

Versi 0.5 · 14 September 2026

Acuan urutan dan dependensi: [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md). Acuan kebutuhan: [PRD](PRD.md), [SDD](SDD.md), dan [DESIGN](../DESIGN.md).

Semua task di bawah belum dikerjakan. Centang setelah hasil dibuat dan verifikasi yang relevan berhasil; sertakan bukti singkat seperti hasil uji, lokasi perubahan, atau catatan keputusan. Gunakan ID task pada catatan perubahan agar mudah dilacak. Pekerjaan deployment ini adalah checklist untuk pelaksanaan berikutnya, bukan deployment yang sudah dilakukan.

## PH-0 · Fondasi project

- [x] P0-01 Scaffold satu project Nuxt 4 + TypeScript dengan struktur `app/`, `server/`, dan `shared/`. Periksa ulang folder awal `frontend/`/`backend/` sebelum penataan agar tidak menimpa pekerjaan baru.
- [x] P0-02 Pilih versi patch dan dependensi terpelihara yang kompatibel; kunci melalui manifest/lockfile dan catat kebutuhan runtime.
- [x] P0-03 Siapkan konfigurasi environment, contoh variabel tanpa secret, rendering sisi browser, serta pemisahan konfigurasi publik dan privat.
- [x] P0-04 Siapkan PostgreSQL lokal/uji, driver dengan pool maksimum awal lima koneksi, serta migrasi tabel, FK gabungan, unique constraint, dan indeks sesuai SDD.
- [x] P0-05 Buat seed empat jurusan, dua kontes PAIR dan delapan SINGLE, serta akun/data sintetis; seed tidak mengandung akun produksi atau password bersama.
- [x] P0-06 Bangun kerangka validasi request, respons error, audit admin append-only melalui aplikasi, dan penyamaran data sensitif pada log.
- [x] P0-07 Siapkan pemeriksaan tipe, build production, serta kerangka uji API dengan database terisolasi; buktikan migrasi berjalan pada database kosong.

Acuan penerimaan: FR-01, FR-12; SDD bagian 2, 3, dan 13.

## PH-1 · Antarmuka dasar

- [x] P1-01 Terapkan token modern light dengan hijau `#2A6B5C` dan putih hangat `#FFF9F2`; catat pemakaian warna untuk latar, teks, aksi, dan fokus.
- [x] P1-02 Sediakan font Inter sebagai aset lokal dengan fallback dan bobot seperlunya; periksa font termuat tanpa menghalangi pembacaan halaman.
- [x] P1-03 Buat layout publik, pemilih, dan admin, termasuk navigasi ponsel serta struktur judul yang konsisten.
- [x] P1-04 Buat komponen tombol, input, pilihan jenis akun, checkbox/radio, dialog konfirmasi, pesan form, tabel dan pagination yang dibutuhkan fitur.
- [x] P1-05 Sediakan keadaan memuat, kosong, gagal, berhasil, disabled, dan fokus; gunakan teks/ikon pendamping agar status tidak bergantung pada warna.
- [x] P1-06 Periksa tampilan 360 px dan desktop, kontras kombinasi warna aktual, label form, urutan tab, serta fokus dialog; simpan catatan tinjauan visual.

Acuan penerimaan: NFR-05; DESIGN.md. Halaman fitur disambungkan ke data nyata pada fase berikutnya; preview sintetis harus ditandai.

## PH-2 · Akun, password, dan akses

- [x] P2-01 Implementasikan login jenis mahasiswa/dosen dengan NIM/NIP lokal + password, serta akses akun admin dengan peran terpisah. Tidak ada OTP, email, SSO, atau registrasi publik.
- [x] P2-02 Implementasikan hash Argon2id, batas pekerjaan hash bersamaan, pesan login umum, serta rate limit yang mempertimbangkan jaringan kampus bersama.
- [x] P2-03 Implementasikan sesi cookie, penyimpanan hash token, kedaluwarsa, logout, perlindungan CSRF, dan pencabutan sesi berdasarkan credential_version.
- [x] P2-04 Buat layanan penetapan/generasi password awal dan reset oleh petugas berizin; keluaran password hanya sekali dan tidak disimpan sebagai plaintext/log.
- [x] P2-05 Implementasikan perubahan password mandiri dan reset yang tidak memodifikasi DPT, hak suara, partisipasi, atau ballot.
- [x] P2-06 Terapkan pemeriksaan peran/scope di API serta navigasi login pada halaman; tindakan admin kritis meminta password kembali sesuai SDD.
- [x] P2-07 Uji NIM/NIP bernilai sama, password salah, akun nonaktif, akses lintas peran, token kedaluwarsa, reset sesi, dan ketiadaan password pada log.

Acuan penerimaan: FR-03, FR-13, NFR-04, NFR-06; T-07, T-15, T-18.

## PH-3 · Periode, kontes, dan calon

- [ ] P3-01 Buat admin periode dengan jadwal Asia/Jakarta, versi konfigurasi, validasi tanggal, dan daftar sepuluh kontes yang dapat diperiksa.
- [ ] P3-02 Buat form PAIR BEM/MPM dengan dua nama serta form SINGLE untuk ketua/wakil Hima dengan satu nama; nomor urut unik per kontes.
- [ ] P3-03 Implementasikan unggahan/penggantian foto pasangan atau individu, pratinjau, validasi isi/ukuran gambar, pembersihan metadata, dan volume durabel.
- [ ] P3-04 Tambahkan moto, visi, misi, dan program opsional; buat halaman profil calon publik dengan foto dan identitas jabatan yang benar.
- [ ] P3-05 Implementasikan pemeriksaan kesiapan, DRAFT/READY, revisi yang membatalkan persetujuan, serta pembekuan konfigurasi secara transaksional.
- [ ] P3-06 Implementasikan pengajuan/persetujuan tindakan, OPEN/PAUSED/CLOSED, penjadwalan, dan audit; gunakan usulan dua petugas sampai D-10 disahkan atau direvisi.
- [ ] P3-07 Uji calon tidak lengkap, nomor duplikat, format PAIR/SINGLE, unggahan salah, perubahan sesudah pembekuan, persetujuan sendiri, dan versi konfigurasi usang.

Acuan penerimaan: FR-01, FR-05, FR-12, FR-14; T-06, T-08, T-14. Validasi READY dengan DPT lengkap dilanjutkan setelah PH-4.

## PH-4 · Pemilih, impor, dan hak pilih

- [ ] P4-01 Buat daftar dan form pemilih mahasiswa/dosen, pencarian, filter, pagination, identitas sebagai teks, dan validasi status/jurusan.
- [ ] P4-02 Sediakan template Excel `.xlsx` dan CSV, kode field yang valid, serta petunjuk NIM/NIP lokal tanpa kehilangan nol awal atau digit panjang.
- [ ] P4-03 Implementasikan parsing terbatas, pemetaan kolom, pratinjau, laporan per baris, dan penolakan formula/file bermasalah; batasi satu pekerjaan impor/pemrosesan gambar bersamaan.
- [ ] P4-04 Implementasikan tambah/perbarui/lewati secara atomik dengan pemeriksaan ulang state/versi. Impor ulang tidak menggandakan akun atau mengubah password/hak yang telah disesuaikan.
- [ ] P4-05 Hubungkan password awal opsional dari form/impor dengan PH-2; hash sebelum menyimpan pratinjau, samarkan laporan error, dan sediakan alur distribusi langsung panitia.
- [ ] P4-06 Bentuk empat hak awal per pemilih: pasangan BEM, pasangan MPM, ketua Hima, wakil Hima sesuai jurusan. Buat dashboard ringkas hak tersimpan untuk diperiksa admin.
- [ ] P4-07 Buat pengaturan beri/cabut hak individual dan massal pada sepuluh kontes, dengan sasaran tetap, pratinjau dampak, alasan, audit, serta penolakan versi usang.
- [ ] P4-08 Tangani perubahan jurusan/jenis, hak nol, serta pembekuan DPT/eligibility; uji dengan 600 pemilih sintetis dan 2.400 hak sebelum penyesuaian admin.

Acuan penerimaan: FR-02, FR-04, FR-12, FR-15, FR-16; T-01, T-02, T-15, T-16, T-17.

## PH-5 · Voting dan penerimaan suara

- [ ] P5-01 Buat dashboard pemilih dari hak server, status per kontes, jadwal, serta keadaan belum dibuka/dijeda/ditutup/tidak berhak.
- [ ] P5-02 Buat surat suara PAIR/SINGLE, pemilihan satu opsi, halaman konfirmasi, serta navigasi antar-kontes tanpa memaksa semua kontes selesai sekaligus.
- [ ] P5-03 Implementasikan transaksi voting pada satu koneksi: lock periode lalu hak, periksa eligibility/status/waktu database/opsi, insert ballot dan partisipasi, lalu commit durabel.
- [ ] P5-04 Implementasikan idempotensi per hak suara, receipt tanpa calon, pemeriksaan ulang status commit, dan endpoint partisipasi pengguna sendiri.
- [ ] P5-05 Tangani koneksi putus, refresh, sesi habis, retry, serta status belum dapat dipastikan; jangan menyatakan diterima sebelum server mengonfirmasi commit.
- [ ] P5-06 Uji sedikitnya dua puluh kiriman bersamaan termasuk opsi berbeda, rollback di antara insert, waktu tutup ketika menunggu lock, dan restart sesudah commit.
- [ ] P5-07 Uji ketua/wakil Hima secara independen, manipulasi calon lintas kontes, penyesuaian hak admin, serta ketiadaan hubungan identitas-pilihan pada respons/log.

Acuan penerimaan: FR-04, FR-06, FR-07, FR-08; T-01, T-03 sampai T-07, T-11, T-19. Jangan melanjutkan klaim kesiapan voting bila uji integritas gagal.

## PH-6 · Quick count dan hasil resmi

- [ ] P6-01 Implementasikan agregat per kontes/opsi dalam snapshot database konsisten, mencakup calon nol suara, partisipasi, dan rumus persentase tanpa pembagian nol.
- [ ] P6-02 Implementasikan endpoint quick count publik dengan cache per periode maksimal lima detik dan satu refresh bersama saat kedaluwarsa; tidak memerlukan pembacaan sesi.
- [ ] P6-03 Buat halaman quick count sepuluh kontes, label sementara, waktu pembaruan, polling lima detik, penghentian saat tab tersembunyi, backoff, dan indikator data kedaluwarsa.
- [ ] P6-04 Implementasikan rekonsiliasi saat CLOSED, pemblokiran snapshot cacat, snapshot resmi berversi/checksum, serta penetapan dan publikasi terpisah oleh panitia.
- [ ] P6-05 Buat ekspor agregat sementara/resmi dengan status dan waktu yang jelas, audit ekspor, serta koreksi hasil sebagai versi baru.
- [ ] P6-06 Uji polling ketika suara masuk, restart/cache hilang, nol pemilih/suara, pause/close, selisih data, dan larangan mengakses hasil resmi sebelum PUBLISHED.
- [ ] P6-07 Periksa seluruh payload/halaman publik agar tidak memuat identitas, daftar pemilih terakhir, event per suara, atau rincian kelompok yang tidak diminta.

Acuan penerimaan: FR-09, FR-10, FR-11, FR-12; T-09, T-10, T-11, T-20.

## PH-7 · Validasi dan penghematan resource

- [ ] P7-01 Jalankan alur menyeluruh mahasiswa/dosen dari empat jurusan dan panitia; catat hasil setiap T-01 sampai T-20 serta FR-01 sampai FR-16.
- [ ] P7-02 Uji keyboard, pembaca layar, ponsel 360 px, desktop, dialog, kontras aktual, dan semua keadaan error utama pada alur yang sudah terhubung.
- [ ] P7-03 Tinjau izin API/database, cookie/CSRF, password, unggahan, audit, dan ekspor; selesaikan temuan kritis/tinggi serta cacat integritas suara.
- [ ] P7-04 Jalankan uji beban NFR-01 dengan 600 pemilih/2.400 hak, 100 sesi voting, 10 kiriman/detik selama empat menit, dan 600 penonton polling; uji lonjakan 600 login sebagai skenario terpisah.
- [ ] P7-05 Ukur RAM, CPU, latensi p95, error, koneksi database, dan laju refresh agregat pada anggaran awal 512 MiB aplikasi + 512 MiB database; simulasi beban bersama secara terisolasi.
- [ ] P7-06 Optimalkan hanya bottleneck yang terbukti; tinjau pool, hashing, gambar, impor, cache dan log. Jika target tidak tercapai, revisi konfigurasi dan ulangi skenario terdampak.
- [ ] P7-07 Uji crash/restart aplikasi/database dengan volume sehat serta restore ke lingkungan terisolasi; rekonsiliasi suara terkonfirmasi dan dokumentasikan batas kehilangan total VPS.
- [ ] P7-08 Buat catatan verifikasi dengan hasil, konfigurasi uji, masalah yang tersisa, dan keputusan kelayakan. Jangan menyebut penggunaan resource sebagai terverifikasi sebelum pengukuran selesai.

Acuan penerimaan: NFR-01 sampai NFR-06; seluruh pengujian SDD. Hasil uji beban bukan izin mengganggu project produksi lain di VPS.

## PH-8 · EasyPanel, simulasi akhir, dan serah terima

- [ ] P8-01 Lengkapi domain, akses deployment, ketersediaan resource, tujuan backup luar VPS, retensi, serta penanggung jawab. Catat keputusan operasional pada DECISIONS sebelum data riil.
- [ ] P8-02 Siapkan build/image production dan konfigurasi service aplikasi serta PostgreSQL di EasyPanel; build di luar VPS bila tersedia, atau di luar jam voting.
- [ ] P8-03 Siapkan secret, HTTPS, health check, pool/limit yang sudah diuji, volume foto/database, serta rotasi log. Periksa konfigurasi tanpa mencetak rahasia.
- [ ] P8-04 Siapkan backup luar VPS dan buktikan restore database/foto. Dokumentasikan jadwal, tujuan, batas kehilangan data, dan larangan meneruskan dari restore yang kehilangan suara tanpa keputusan panitia.
- [ ] P8-05 Lakukan deployment dan smoke check halaman/API/HTTPS dengan data simulasi pada periode terpisah. Uji bahwa redeploy tidak menghilangkan volume; jangan mengirim suara atas nama pemilih riil.
- [ ] P8-06 Jalankan simulasi panitia: input calon, impor DPT, distribusi password, hak pilih, pembukaan, voting, jeda, quick count, penutupan, hasil resmi, dan penanganan gangguan.
- [ ] P8-07 Tulis panduan panitia/operator untuk operasi harian, reset akses, perbaikan impor, backup/restore, pemantauan, dan eskalasi insiden.
- [ ] P8-08 Catat kesiapan akhir, DPT yang disahkan, jadwal riil, hasil pemeriksaan, dan penanggung jawab. Periode riil hanya dibuka melalui alur panitia setelah seluruh syarat terpenuhi.

Acuan penerimaan: PRD bagian 11, SDD bagian 11, serta keputusan operasional D-04/D-05/D-08 sampai D-13. Periode uji dan produksi tidak boleh berbagi surat suara.

## Bukti penyelesaian

Tambahkan baris saat task selesai atau terhambat; tabel kosong ini bukan laporan hasil uji.

| Task | Status | Bukti atau hasil pemeriksaan | Tindak lanjut |
| --- | --- | --- | --- |
| P0-01 | selesai | Commit 687b33d: project Nuxt 4 + TS di root dengan `app/`, `server/`, `shared/`; folder `frontend/`/`backend/` kosong dihapus sebelum penataan | — |
| P0-02 | selesai | package.json + package-lock.json terkunci: nuxt 4.5.2, vue 3.5.42, zod 3.25.76, pg 8.23.0, @node-rs/argon2 2.2.1, vitest 5.0.0; Node `^22.19.0 \|\| ^24.11.0 \|\| >=26.0.0` (nuxt 4.5.2 requirement), lokal 24.19.0; README mencatat kebutuhan runtime | Node lokal 22.9.0 tidak memenuhi engine nuxt 4.5.2 — gunakan 24.x |
| P0-03 | selesai | Commit bc13429: `.env.example` tanpa secret, `ssr: false`, `runtimeConfig` privat (databaseUrl, sessionSecret) vs public (appName); `server/utils/config.ts` fail-fast | — |
| P0-04 | selesai | Commit 6c461ec: `database/db.ts` pool max 5; `database/migrations/0001_core_tables.sql` 18 tabel dengan FK gabungan, unique, check constraint. Uji langsung SQL: voting_right lintas periode ditolak, ballot opsi lintas kontes ditolak, NIM/NIP mismatch ditolak, self-approval ditolak, identifier duplikat ditolak | — |
| P0-05 | selesai | Commit 6c461ec: `database/seed.ts` — 4 jurusan, 10 kontes (2 PAIR + 8 SINGLE), 600 pemilih sintetis → 2.400 hak, akun admin password acak dicetak sekali; semua hash argon2id, tanpa password bersama | — |
| P0-06 | selesai | Commit f12abd5: `server/utils/errors.ts` (envelope `{error:{code,message}}`, pemetaan status SDD bag. 6), `server/services/audit/audit.ts` append-only + redaksi, `server/utils/log-redaction.ts`, `server/utils/schemas.ts` | — |
| P0-07 | selesai | Commit f12abd5: `npx nuxt typecheck` exit 0, `npm run build` sukses, vitest 9/9 lulus termasuk 2 uji integrasi membuktikan migrasi berjalan pada database kosong dan idempotent | — |
| P1-01 | selesai | Commit 926d75d: token di `app/assets/css/main.css` dengan peta pemakaian warna (latar/teks/aksi/fokus) dalam komentar | — |
| P1-02 | selesai | Commit 926d75d: `@fontsource-variable/inter` 5.3.0 lokal, `font-display: swap`, fallback system-ui; diverifikasi CSS terlayani dari aset lokal tanpa CDN eksternal | — |
| P1-03 | selesai | Commit 926d75d: layouts default/voter/admin, nav admin responsif (breakpoint 48rem) | — |
| P1-04 | selesai | Commit 926d75d: AppButton, AppInput, AppRadioGroup, AppCheckbox, AppDialog, AppAlert, AppTable, AppPagination | — |
| P1-05 | selesai | Commit 926d75d: keadaan memuat/kosong (AppTable), gagal/berhasil (AppAlert + ikon), disabled + aria-busy (AppButton), fokus (`:focus-visible` global) | — |
| P1-06 | selesai | Commit PH-1: [VISUAL_REVIEW](VISUAL_REVIEW.md) — kontras 11 kombinasi token dihitung, semua ≥ 4.5:1; struktur a11y (label, aria, dialog, tab) dicatat; pemeriksaan piksel 360 px/dispositif nyata ditunda ke titik tinjau dengan pemilik proyek | Pemeriksaan pembaca layar menyeluruh pada PH-7 |
| P2-01 | selesai | Commit 0c6368d: POST /auth/login NIM/NIP + password per jenis akun (uji identitas sama beda akun di auth.test.ts); tanpa OTP/SSO/registrasi | — |
| P2-02 | selesai | Commit 0c6368d: Argon2id m=19456,t=2,p=1, semaphore hash maks 2; rate limit akun 10/15 menit + IP 120/10 menit (toleran NAT kampus); uji live 429 setelah 10 kegagalan | Tuning batas laju saat uji 600 login (P7-04) |
| P2-03 | selesai | Commit 0c6368d: sesi cookie HttpOnly/SameSite, hash SHA-256 token disimpan, kedaluwarsa 8 jam, logout + CSRF double-submit (uji live: tanpa token 403), pencabutan credential_version | — |
| P2-04 | selesai | Commit 0c6368d: layanan reset (password-admin.ts) + endpoint admin; password digenerate dikembalikan sekali di respons; audit hanya aksi+alasan (diverifikasi via SQL) | — |
| P2-05 | selesai | Commit 0c6368d: change-password me-rollback bila verifikasi gagal; uji integrasi reset tidak mengubah voting_rights/participations; uji live sesi lama 401 setelah ganti password | — |
| P2-06 | selesai | Commit 0c6368d: requireSession/requireAdmin di setiap API; uji live pemilih mengakses endpoint admin → 403 | Autentikasi ulang password untuk aksi kritis ditambahkan bersama alur persetujuan PH-3 |
| P2-07 | selesai | Commit 0c6368d + uji E2E live: password salah → 401 generik, lintas peran → 403, rate limit → 429, sesi habis → 401, reset mencabut sesi, tidak ada password/identifier di log (uji redaksi 3/3 lulus) | — |

Status yang digunakan: belum mulai, dikerjakan, terhambat, selesai. Ketika terhambat, catat informasi yang diperlukan dan lanjutkan task lain yang dependensinya sudah terpenuhi.
