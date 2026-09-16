# PEMIRA Rewrite Plan

Dokumen ini menjadi roadmap rewrite aplikasi pemilihan lama berbasis PHP/CodeIgniter ke satu aplikasi Nuxt yang dapat dipakai ulang setiap tahun. Targetnya adalah mempertahankan workflow panitia yang sudah terbukti, sambil memperbaiki keamanan, integritas suara, dan kemudahan operasional.

## Tujuan

- Satu aplikasi untuk seluruh organisasi, jurusan, dan kontes.
- Setiap tahun dimulai dengan membuat periode baru, bukan menyalin folder aplikasi.
- Alur panitia tetap familiar: pemilih → kandidat → hak pilih → jadwal → voting → rekap → publikasi.
- Data suara tidak dapat digandakan, diubah, atau di-reset melalui aplikasi.
- Migrasi dari sistem lama dilakukan bertahap dan dapat diverifikasi.

## Prinsip rewrite

1. **Pertahankan perilaku bisnis, bukan kelemahan teknis.** Fitur lama seperti import pemilih, verifikasi, upload foto, statistik, barcode, dan cetak hasil tetap dipertahankan bila masih diperlukan.
2. **Backend menjadi sumber kebenaran.** Frontend tidak menentukan hak pilih, status periode, atau hasil suara.
3. **Satu periode terisolasi.** Data pemilih, kontes, hak, suara, dan hasil selalu terikat ke `election_id`.
4. **Tidak ada migrasi suara aktif tanpa keputusan khusus.** Data historis boleh diarsipkan, tetapi suara pemilihan baru hanya masuk melalui alur Nuxt.
5. **Setiap milestone harus bisa diuji dengan data sintetis sebelum data riil digunakan.**

## Status saat ini

Fondasi backend, autentikasi, model periode, hak pilih, transaksi voting, quick count, snapshot hasil, audit, dan sebagian halaman pemilih sudah tersedia. Login sudah mengikuti pola final:

- `/login` untuk mahasiswa dan dosen.
- `/admin` untuk panitia dan admin.

UI admin masih perlu mengejar feature parity dengan aplikasi CodeIgniter lama. Pekerjaan yang belum menjadi fokus utama adalah upload foto dan distribusi password awal melalui UI.

## Milestone pengerjaan

### M1 — Admin pemilih dan DPT

- [ ] Daftar pemilih dengan pencarian, filter jenis/jurusan/status, dan pagination.
- [ ] Tambah, edit, nonaktifkan, dan aktifkan pemilih.
- [ ] Template XLSX/CSV dengan preservasi nol di depan NIM/NIP.
- [ ] Import: upload, preview, validasi per baris, commit, dan laporan hasil.
- [ ] Password awal opsional: generate sekali, tampilkan hanya ke panitia, audit tanpa plaintext.
- [ ] Verifikasi bahwa import ulang tidak menggandakan pemilih atau mengubah hak/password secara diam-diam.

**Selesai jika:** panitia dapat menyiapkan DPT baru dari data kosong sampai siap diberi hak pilih tanpa SQL manual.

### M2 — Kandidat dan profil publik

- [ ] Daftar kontes per periode.
- [ ] Form pasangan BEM/MPM.
- [ ] Form calon ketua dan wakil Hima secara independen.
- [ ] Upload, penggantian, preview, validasi ukuran/isi gambar, dan penyimpanan durabel.
- [ ] Form moto, visi, misi, dan program.
- [ ] Preview profil publik sebelum periode dikunci.

**Selesai jika:** semua kandidat untuk sepuluh kontes dapat dimasukkan dan pemeriksaan readiness memberikan alasan yang jelas bila belum lengkap.

### M3 — Hak pilih dan kesiapan periode

- [ ] Dashboard hak pilih per kontes.
- [ ] Generate hak default sesuai jenis pemilih dan jurusan.
- [ ] Beri/cabut hak individual dan massal.
- [ ] Preview dampak perubahan dan alasan wajib.
- [ ] Checklist DPT, jadwal, kontes, dan kandidat.
- [ ] UI transisi DRAFT → READY dengan revisi kembali ke DRAFT bila konfigurasi berubah.

**Selesai jika:** panitia dapat membuktikan siapa yang berhak memilih kontes tertentu sebelum voting dibuka.

### M4 — Operasional voting

- [ ] UI pengajuan dan persetujuan aksi panitia.
- [ ] Buka, jeda, lanjutkan, dan tutup periode.
- [ ] Konfirmasi dua petugas untuk aksi yang memerlukannya.
- [ ] Status operasional dan alasan insiden yang terlihat jelas.
- [ ] Simulasi login, voting parsial, refresh, retry, sesi habis, dan koneksi putus.

**Selesai jika:** simulasi panitia dari periode READY sampai CLOSED dapat dilakukan tanpa mengubah database secara manual.

### M5 — Statistik, audit, hasil, dan cetak

- [ ] Statistik partisipasi per jurusan dan jenis pemilih.
- [ ] Rekap per kontes dan opsi.
- [ ] Halaman audit dengan filter tindakan dan periode.
- [ ] Rekonsiliasi sebelum hasil resmi.
- [ ] Snapshot hasil, checksum, persetujuan, dan publikasi.
- [ ] Export rekap sementara/resmi.
- [ ] Receipt digital dan opsi cetak bila kebutuhan operasional masih ada.

**Selesai jika:** hasil yang dipublikasikan memiliki versi, waktu, status, dan angka yang cocok dengan rekonsiliasi.

### M6 — Migrasi, deployment, dan serah terima

- [ ] Inventaris data lama: pemilih, kandidat, organisasi, dan hasil historis.
- [ ] Mapping kolom lama ke skema Nuxt.
- [ ] Script migrasi hanya untuk data master/historis yang disetujui.
- [ ] Uji migrasi pada database terisolasi dan rekonsiliasi jumlah baris.
- [ ] Backup luar VPS dan uji restore database/foto.
- [ ] Simulasi pemilihan penuh dengan data sintetis.
- [ ] Checklist go-live, PIC panitia, jadwal, dan prosedur eskalasi.

**Selesai jika:** deployment baru dapat dipulihkan dan panitia memiliki prosedur tahunan yang terdokumentasi.

## Strategi data lama

| Data lama | Perlakuan |
|---|---|
| Pemilih aktif | Import sebagai data pemilih baru; password dibuat ulang, tidak menyalin password plaintext |
| Kandidat | Masukkan ulang melalui form kandidat; foto diperiksa dan metadata dibersihkan |
| Jabatan/dapil | Mapping ke kontes dan scope jurusan pada periode baru |
| Status sudah memilih | Tidak disalin ke periode baru; partisipasi selalu dimulai kosong |
| Suara dan hasil lama | Arsip read-only terpisah bila dibutuhkan untuk laporan historis |
| Akun admin/panitia | Buat ulang dengan role dan password baru; cabut akun yang tidak lagi berwenang |

## Urutan eksekusi terdekat

1. M1: halaman admin pemilih dan import.
2. M2: halaman kandidat dan upload foto.
3. M3: hak pilih dan readiness.
4. M4: workflow operasional panitia.
5. M5: statistik, audit, export, dan cetak.
6. M6: migrasi data, backup/restore, dan simulasi go-live.

## Kriteria siap dipakai pemilihan nyata

- DPT disahkan panitia.
- Sepuluh kontes dan seluruh kandidat lengkap.
- Hak pilih sudah direview.
- Semua alur pemilih dan panitia lulus smoke test.
- Tidak ada temuan keamanan kritis/tinggi.
- Rekonsiliasi dan publikasi hasil diuji.
- Backup luar VPS dan restore sudah terbukti.
- PIC operasional dan prosedur insiden sudah ditetapkan.

Dokumen teknis rinci tetap berada di `docs/PRD.md`, `docs/SDD.md`, `docs/TASKLIST.md`, dan `docs/OPERATIONS.md`. Dokumen ini berfungsi sebagai urutan eksekusi dan jembatan migrasi dari aplikasi lama.
