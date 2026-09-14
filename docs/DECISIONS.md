# Keputusan dan asumsi PEMIRA

Versi 0.5 · 14 September 2026 · Sebagian dikonfirmasi

## Keputusan yang sudah ditetapkan

Pemilik proyek mengonfirmasi mahasiswa dan dosen sebagai pemilih, input calon melalui website, input pemilih manual/Excel/CSV, serta pengaturan hak pilih oleh admin. BEM dan MPM memilih pasangan. Empat Hima masing-masing memilih ketua dan wakil secara terpisah, sehingga ada sepuluh kontes dan empat hak awal per pemilih. Login memakai NIM/NIP lokal dengan password dari panitia. Hasil sementara ditampilkan selama voting.

Pemilik proyek menyetujui Nuxt 4 menggantikan Nuxt 3 setelah pemeriksaan masa dukungan. Deployment pada VPS 4 core CPU/8 GB RAM dengan EasyPanel, berbagi dengan project lain. Perkiraan pemilih 600 orang. Pemilik proyek menyerahkan pilihan database kepada pengembang; database ditetapkan PostgreSQL 17 dengan patch terpelihara.

## Daftar keputusan

| ID | Topik | Keputusan atau usulan yang berlaku | Status |
| --- | --- | --- | --- |
| D-01 | Hak pilih | Default empat: pasangan BEM, pasangan MPM, ketua Hima, wakil ketua Hima sesuai jurusan; admin dapat menyesuaikan sebelum pembekuan | Dikonfirmasi |
| D-02 | Format calon | BEM/MPM PAIR; delapan kontes Hima SINGLE, terdiri dari ketua dan wakil untuk Keperawatan, Kebidanan, Kesehatan Gigi, Ortotik Prostetik | Dikonfirmasi |
| D-03 | Login | Mahasiswa memakai NIM, dosen memakai NIP lokal dari panitia, beserta password yang ditetapkan/dibagikan panitia. Tanpa OTP, email, atau SSO. Usulan login meminta jenis pemilih untuk membedakan NIM/NIP yang sama | Metode dikonfirmasi; detail form rancangan |
| D-04 | Abstain/kotak kosong | Default tidak menyediakan opsi kosong; meninggalkan kontes tidak mencatat suara abstain | Belum disahkan panitia |
| D-05 | Penetapan pemenang | Aplikasi merekap; panitia menetapkan pemenang, seri, calon tunggal, dan sengketa | Belum disahkan panitia |
| D-06 | Kapasitas | Sekitar 600 pemilih; VPS 4 core/8 GB dipakai bersama project lain. Usulan limit runtime aplikasi 512 MiB/1 vCPU dan database 512 MiB/0,5 vCPU; wajib uji beban sebelum produksi | Jumlah/spesifikasi dikonfirmasi; limit belum diuji |
| D-07 | Stack dan deployment | Nuxt 4, TypeScript, Nitro, PostgreSQL 17, VPS + EasyPanel. Major Nuxt 4 disetujui pemilik proyek; PostgreSQL dipilih berdasarkan delegasi pengguna. Domain, volume, lokasi backup, dan driver tetap perlu dirinci | Stack/database ditetapkan |
| D-08 | Hasil selama voting | Quick count tersedia saat voting. Usulan halaman publik, polling 5 detik dengan cache agregat 5 detik; label sementara, bukan penetapan resmi | Live count dikonfirmasi; akses publik/interval rancangan |
| D-09 | Retensi dan cadangan | Tentukan masa simpan data/ekspor/backup serta tujuan cadangan di luar VPS. Restore tidak boleh diam-diam menghilangkan suara yang terkonfirmasi | Terbuka sebelum data riil |
| D-10 | Persetujuan petugas | Usulan dua akun berbeda untuk pembukaan, pemulihan jeda, dan hasil resmi. Autentikasi ulang memakai password; tidak ada OTP | Belum disahkan panitia |
| D-11 | DPT dan jurusan | Empat jurusan dari brief; akademik/panitia mengesahkan pemetaan prodi dan status aktif | Terbuka sebelum impor riil |
| D-12 | Batas privasi | Admin aplikasi tidak memperoleh pasangan identitas-pilihan. Operator database tetap dipercaya; panitia yang mengetahui password dapat menyalahgunakan akun. Live count kelompok kecil dapat membantu inferensi pilihan | Batas rancangan perlu ditinjau panitia |
| D-13 | Jadwal/insiden | Usulan zona Asia/Jakarta; jeda tidak menghapus suara, periode CLOSED tidak dibuka ulang. Jadwal dan aturan pemilihan ulang belum diberikan | Terbuka |
| D-14 | Identitas dosen | NIP lokal yang disediakan panitia, disimpan sebagai teks tanpa mengasumsikan panjang/format NIP nasional | Dikonfirmasi |
| D-15 | Input data | Calon manual melalui website; pasangan/individu memiliki foto, moto, visi, misi. Pemilih manual atau Excel .xlsx/CSV. Password awal dapat ditentukan panitia atau dihasilkan per akun | Alur dikonfirmasi; detail provisioning rancangan |
| D-16 | Admin hak pilih | Per orang/massal untuk sepuluh kontes, alasan dan audit, hanya DRAFT. Impor ulang tidak menimpa penyesuaian hak | Kemampuan dikonfirmasi; prosedur rancangan |
| D-17 | Desain | Modern light, hijau #2A6B5C, putih hangat #FFF9F2, font Inter; berlaku pada seluruh area aplikasi. Arahan dicatat di DESIGN.md | Dikonfirmasi pemilik proyek |

## Dasar pemilihan teknis

Nuxt 3 telah mencapai akhir dukungan pada 31 Juli 2026; pemilik proyek menyetujui Nuxt 4. [Dokumentasi Nuxt 3](https://nuxt.com/docs/3.x/getting-started/installation).

PostgreSQL dipilih karena transaksi dan penguncian barisnya sesuai desain pencegahan suara ganda. PostgreSQL 17 masih berada dalam masa dukungan; gunakan patch keamanan terpelihara ketika implementasi. [Penguncian PostgreSQL](https://www.postgresql.org/docs/17/explicit-locking.html), [kebijakan dukungan](https://www.postgresql.org/support/versioning/).

Batas RAM/CPU adalah anggaran uji, bukan hasil benchmark atau janji bahwa sisa VPS mencukupi. Beban layanan lain dan penonton publik belum diketahui. Pembatasan resource serta uji beban harus mencakup lonjakan login, voting, dan pembacaan quick count bersama-sama.

## Cara menutup keputusan

Catat keputusan final, pihak yang menyetujui, tanggal, dan dampak pada PRD/SDD. Keputusan terbuka tidak membatalkan kebutuhan yang sudah dikonfirmasi; pekerjaan rancangan dapat berjalan sambil menunggu aturan operasional akhir.
