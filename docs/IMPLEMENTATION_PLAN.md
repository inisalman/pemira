# Fase implementasi PEMIRA

Versi 0.5 · 14 September 2026 · Rencana, belum dikerjakan

Acuan: [PRD](PRD.md), [SDD](SDD.md), [keputusan](DECISIONS.md), dan [arah desain](../DESIGN.md). Rincian pekerjaan dilacak di [TASKLIST](TASKLIST.md).

## Batas pekerjaan

Implementasi menggunakan Nuxt 4 full-stack dan PostgreSQL 17 pada VPS bersama yang dikelola melalui EasyPanel. Sasaran sekitar 600 pemilih. Desain modern light memakai hijau `#2A6B5C`, putih hangat `#FFF9F2`, dan Inter.

Produk memiliki sepuluh kontes: pasangan BEM, pasangan MPM, serta ketua dan wakil untuk masing-masing empat Hima. Hak awal mahasiswa/dosen adalah empat kontes sesuai jurusan, dengan penyesuaian admin. Login menggunakan NIM/NIP lokal dan password panitia. Calon diinput manual, pemilih manual atau Excel/CSV, dan quick count tampil saat voting.

Dokumen ini menyusun pekerjaan, bukan instruksi untuk langsung menjalankan deployment. Semua checklist implementasi dimulai belum selesai. Estimasi tanggal ditetapkan setelah kapasitas pelaksana dan jadwal PEMIRA tersedia; urutan tidak bergantung pada perkiraan durasi yang belum diketahui.

## Urutan fase

| Fase | Hasil yang diserahkan | Bergantung pada | Syarat selesai |
| --- | --- | --- | --- |
| PH-0 Fondasi project | Project Nuxt 4, koneksi PostgreSQL, migrasi, seed sintetis, kerangka audit | Dokumen saat ini | Build dan pemeriksaan tipe lulus; database baru dapat dibuat ulang dari migrasi |
| PH-1 Antarmuka dasar | Token desain, Inter, komponen form/tabel, layout publik/pemilih/admin | PH-0 | Layout dapat dipakai di ponsel/desktop dengan keyboard, sesuai DESIGN |
| PH-2 Akun dan akses | Login lokal, sesi, peran, password awal/reset, perlindungan endpoint | PH-0, PH-1 | NIM/NIP dibedakan; reset mencabut sesi; peran tidak dapat dilewati melalui API |
| PH-3 Periode dan calon | Admin periode, sepuluh kontes, calon PAIR/SINGLE, foto dan pemeriksaan kesiapan | PH-1, PH-2 | Form membedakan pasangan/individu; data tidak lengkap menahan pembukaan |
| PH-4 Pemilih dan hak pilih | Input manual, impor Excel/CSV, password awal, hak individu/massal | PH-2, PH-3 | 600 pemilih sintetis membentuk 2.400 hak awal; impor ulang mempertahankan penyesuaian |
| PH-5 Voting | Dashboard, konfirmasi, penerimaan suara atomik, status setelah gangguan | PH-3, PH-4 | Pengiriman bersamaan tidak menggandakan suara; ketua/wakil Hima independen |
| PH-6 Quick count dan hasil | Halaman quick count, cache agregat, rekonsiliasi, ekspor dan hasil resmi | PH-5 | Angka cocok dengan suara commit; hasil sementara/resmi dibedakan; error tidak tampil sebagai nol |
| PH-7 Validasi menyeluruh | Bukti pengujian fungsi, aksesibilitas, privasi, beban dan pemulihan | PH-1 sampai PH-6 | Skenario SDD lulus; batas resource diuji; masalah yang menghalangi pemilihan diselesaikan |
| PH-8 Deployment dan serah terima | Konfigurasi EasyPanel, backup, panduan panitia, simulasi akhir | PH-7 + kesiapan operasional | HTTPS dan volume terverifikasi; restore berhasil; panitia siap mengoperasikan periode riil |

Nomor task mengikuti fase: misalnya P5-03 merupakan pekerjaan transaksi voting pada PH-5. Setiap task membawa hasil yang dapat diperiksa; checklist tidak dicentang hanya karena sebagian kode sudah ditulis.

## Cara menjalankan tiap fase

Kerjakan satu alur lengkap dari halaman ke API dan database, lalu periksa perilakunya. Sertakan status memuat, kosong, gagal, berhasil, dan akses ditolak pada fitur yang terkait. Gunakan data sintetis hingga aturan pengumpulan data dan tujuan backup disepakati.

Pengujian transaksi dan hak pilih dimulai pada fase fitur masing-masing. PH-7 menggabungkan pengujian menjadi bukti kelayakan rilis; fase tersebut bukan waktu pertama memeriksa pencegahan suara ganda. Perubahan berdampak pada aturan harus memperbarui PRD/SDD beserta task terkait.

Audit dibuat sejak PH-0 dan digunakan setiap kali menambahkan mutasi admin. Pemeriksaan izin dilakukan di server. UI hanya membantu navigasi dan tidak menjadi pengaman utama.

## Titik tinjau

| Setelah fase | Yang dapat diperiksa pemilik proyek/panitia |
| --- | --- |
| PH-1 | Kesesuaian warna/font, layout ponsel, form dan tabel admin |
| PH-4 | Pengelolaan calon, input pemilih, impor, distribusi akses, dan perubahan hak |
| PH-5 | Simulasi mahasiswa/dosen memilih empat kontes, termasuk pengiriman ulang |
| PH-6 | Quick count bergerak, label sementara, dan hasil resmi setelah penutupan |
| PH-8 | Sistem siap dioperasikan, panduan, backup dan kontak penanggung jawab |

Titik tinjau adalah kesempatan memeriksa hasil, bukan permintaan persetujuan tambahan untuk pekerjaan lokal yang sudah diotorisasi.

## Keputusan yang dapat diselesaikan sambil berjalan

Tidak ada pertanyaan tambahan yang menghalangi penyusunan fase atau pengerjaan fondasi. Beberapa aturan operasional masih dicatat terpisah agar rancangan tidak dianggap pengesahan panitia.

| Sebelum | Hal yang perlu ditetapkan | Acuan |
| --- | --- | --- |
| Aturan surat suara dan hasil dianggap final | Kotak kosong/abstain, calon tunggal, seri, dan sengketa | D-04, D-05 |
| Alur persetujuan admin difinalkan | Pemisahan petugas dan persetujuan dua akun | D-10 |
| Pengumpulan data riil | DPT/status aktif, retensi, tujuan cadangan, dan batas privasi | D-09, D-11, D-12 |
| Halaman publik dipublikasikan | Peninjauan akses publik dan interval quick count yang diusulkan | D-08 |
| Deployment produksi | Domain, akses layanan, lokasi volume/backup, resource tersedia di VPS | D-06, D-07 |
| Voting dibuka | Jadwal, penanggung jawab, dan prosedur insiden/pemilihan ulang | D-13 |

Sampai ada keputusan lain, implementasi mengikuti asumsi yang tertulis dalam DECISIONS: tanpa suara kosong, hasil resmi ditetapkan panitia, dan persetujuan dua akun untuk tindakan tertentu. Jangan mengubah asumsi menjadi aturan resmi hanya karena fiturnya selesai.

## Kriteria rilis

- Semua FR-01 sampai FR-16 memiliki bukti penerimaan, termasuk pengujian T-01 sampai T-20 pada SDD.
- Identitas tidak terhubung dengan pilihan dalam respons, ekspor, receipt, atau log aplikasi; batas privasi terdokumentasi.
- Data sintetis 600 pemilih/2.400 hak lolos uji voting, login, dan quick count pada limit yang direncanakan.
- Anggaran awal aplikasi 512 MiB/1 vCPU dan database 512 MiB/0,5 vCPU ditinjau berdasarkan hasil uji, bukan dianggap sudah memadai.
- Restart dengan volume sehat menjaga suara terkonfirmasi; restore di lingkungan terisolasi berhasil.
- Tidak ada masalah integritas suara atau temuan keamanan kritis/tinggi yang belum diselesaikan.
- Domain HTTPS, volume persisten, cadangan luar VPS, panduan, serta keputusan operasional siap sebelum pemilihan riil.

Status akhir PH-8 berarti siap dioperasikan. Pembukaan voting tetap mengikuti jadwal dan persetujuan panitia di aplikasi, bukan otomatis akibat deployment.
