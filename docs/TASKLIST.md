# Checklist implementasi PEMIRA

Versi 0.5 · 14 September 2026

Acuan urutan dan dependensi: [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md). Acuan kebutuhan: [PRD](PRD.md), [SDD](SDD.md), dan [DESIGN](../DESIGN.md).

Semua task di bawah belum dikerjakan. Centang setelah hasil dibuat dan verifikasi yang relevan berhasil; sertakan bukti singkat seperti hasil uji, lokasi perubahan, atau catatan keputusan. Gunakan ID task pada catatan perubahan agar mudah dilacak. Pekerjaan deployment ini adalah checklist untuk pelaksanaan berikutnya, bukan deployment yang sudah dilakukan.

## PH-0 · Fondasi project

- [ ] P0-01 Scaffold satu project Nuxt 4 + TypeScript dengan struktur `app/`, `server/`, dan `shared/`. Periksa ulang folder awal `frontend/`/`backend/` sebelum penataan agar tidak menimpa pekerjaan baru.
- [ ] P0-02 Pilih versi patch dan dependensi terpelihara yang kompatibel; kunci melalui manifest/lockfile dan catat kebutuhan runtime.
- [ ] P0-03 Siapkan konfigurasi environment, contoh variabel tanpa secret, rendering sisi browser, serta pemisahan konfigurasi publik dan privat.
- [ ] P0-04 Siapkan PostgreSQL lokal/uji, driver dengan pool maksimum awal lima koneksi, serta migrasi tabel, FK gabungan, unique constraint, dan indeks sesuai SDD.
- [ ] P0-05 Buat seed empat jurusan, dua kontes PAIR dan delapan SINGLE, serta akun/data sintetis; seed tidak mengandung akun produksi atau password bersama.
- [ ] P0-06 Bangun kerangka validasi request, respons error, audit admin append-only melalui aplikasi, dan penyamaran data sensitif pada log.
- [ ] P0-07 Siapkan pemeriksaan tipe, build production, serta kerangka uji API dengan database terisolasi; buktikan migrasi berjalan pada database kosong.

Acuan penerimaan: FR-01, FR-12; SDD bagian 2, 3, dan 13.

## PH-1 · Antarmuka dasar

- [ ] P1-01 Terapkan token modern light dengan hijau `#2A6B5C` dan putih hangat `#FFF9F2`; catat pemakaian warna untuk latar, teks, aksi, dan fokus.
- [ ] P1-02 Sediakan font Inter sebagai aset lokal dengan fallback dan bobot seperlunya; periksa font termuat tanpa menghalangi pembacaan halaman.
- [ ] P1-03 Buat layout publik, pemilih, dan admin, termasuk navigasi ponsel serta struktur judul yang konsisten.
- [ ] P1-04 Buat komponen tombol, input, pilihan jenis akun, checkbox/radio, dialog konfirmasi, pesan form, tabel dan pagination yang dibutuhkan fitur.
- [ ] P1-05 Sediakan keadaan memuat, kosong, gagal, berhasil, disabled, dan fokus; gunakan teks/ikon pendamping agar status tidak bergantung pada warna.
- [ ] P1-06 Periksa tampilan 360 px dan desktop, kontras kombinasi warna aktual, label form, urutan tab, serta fokus dialog; simpan catatan tinjauan visual.

Acuan penerimaan: NFR-05; DESIGN.md. Halaman fitur disambungkan ke data nyata pada fase berikutnya; preview sintetis harus ditandai.

## PH-2 · Akun, password, dan akses

- [ ] P2-01 Implementasikan login jenis mahasiswa/dosen dengan NIM/NIP lokal + password, serta akses akun admin dengan peran terpisah. Tidak ada OTP, email, SSO, atau registrasi publik.
- [ ] P2-02 Implementasikan hash Argon2id, batas pekerjaan hash bersamaan, pesan login umum, serta rate limit yang mempertimbangkan jaringan kampus bersama.
- [ ] P2-03 Implementasikan sesi cookie, penyimpanan hash token, kedaluwarsa, logout, perlindungan CSRF, dan pencabutan sesi berdasarkan credential_version.
- [ ] P2-04 Buat layanan penetapan/generasi password awal dan reset oleh petugas berizin; keluaran password hanya sekali dan tidak disimpan sebagai plaintext/log.
- [ ] P2-05 Implementasikan perubahan password mandiri dan reset yang tidak memodifikasi DPT, hak suara, partisipasi, atau ballot.
- [ ] P2-06 Terapkan pemeriksaan peran/scope di API serta navigasi login pada halaman; tindakan admin kritis meminta password kembali sesuai SDD.
- [ ] P2-07 Uji NIM/NIP bernilai sama, password salah, akun nonaktif, akses lintas peran, token kedaluwarsa, reset sesi, dan ketiadaan password pada log.

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

Status yang digunakan: belum mulai, dikerjakan, terhambat, selesai. Ketika terhambat, catat informasi yang diperlukan dan lanjutkan task lain yang dependensinya sudah terpenuhi.
