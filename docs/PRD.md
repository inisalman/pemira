# PRD PEMIRA

Versi 0.5 · 14 September 2026 · Draft

## 1. Ringkasan produk

PEMIRA menyediakan pemilihan daring bagi mahasiswa dan dosen Poltekkes Jakarta 1. Pemilih melihat calon, menggunakan hak suara pada pemilihan yang sesuai, dan memperoleh konfirmasi bahwa suara diterima. Panitia mengelola periode, DPT, calon, jadwal, serta publikasi hasil.

PEMIRA mencakup enam organisasi dengan sepuluh kontes: BEM dan MPM masing-masing satu pemilihan pasangan, serta empat Hima yang masing-masing memiliki pemilihan ketua dan wakil ketua secara terpisah. Pemilik proyek telah mengonfirmasi bahwa mahasiswa dan dosen dapat memilih pasangan BEM, pasangan MPM, ketua Hima, dan wakil ketua Hima sesuai jurusan. Admin dapat mengatur hak pilih kedua jenis pemilih melalui website. PRD ini menetapkan satu hak suara per pemilih per kontes yang diizinkan. Aturan resmi kampus belum tersedia; asumsi yang perlu disahkan tercatat di [DECISIONS](DECISIONS.md).

## 2. Tujuan dan ukuran keberhasilan

| Tujuan | Kriteria keberhasilan MVP |
| --- | --- |
| Hak suara tepat sasaran | Seluruh akses voting divalidasi terhadap DPT dan kontes di server |
| Mencegah suara ganda | Maksimal satu suara diterima per hak suara, termasuk saat dua perangkat mengirim bersamaan |
| Suara tersimpan utuh | Jumlah surat suara sama dengan jumlah partisipasi pada setiap kontes |
| Menjaga kerahasiaan pilihan | Antarmuka, ekspor, dan log aplikasi tidak memperlihatkan hubungan identitas dengan pilihan |
| Mendukung pemilih melalui ponsel | Alur login hingga konfirmasi voting dapat diselesaikan pada lebar layar 360 px tanpa gulir horizontal |
| Menyediakan rekap yang dapat diperiksa | Total perolehan dapat dihitung ulang dan cocok dengan snapshot hasil publikasi |

Target partisipasi pemilih belum ditentukan. Jumlah pemilih yang hadir tidak digunakan sebagai bukti bahwa sistem benar atau aman.

## 3. Pengguna dan kewenangan

| Peran | Kebutuhan dan kewenangan |
| --- | --- |
| Mahasiswa dan dosen/pemilih | Login, melihat calon, melihat hak suara, memilih, memeriksa status partisipasi sendiri |
| Petugas DPT | Menambah dan mengubah pemilih secara manual, mengimpor Excel/CSV, serta memvalidasi DPT sebelum dibekukan; menangani masalah identitas tanpa mengisi suara pemilih |
| Panitia pemilihan | Menginput pasangan BEM/MPM dan calon individu Hima melalui website, mengatur kontes, jadwal, dan hak pilih mahasiswa/dosen; mengajukan tindakan operasional |
| Penyetuju | Menyetujui pembukaan, pemulihan jeda, dan publikasi yang diajukan petugas lain |
| Pengawas | Membaca audit dan statistik yang diizinkan; tidak mengubah suara atau DPT |
| Operator teknis | Menjaga layanan, cadangan, dan pemulihan; akses infrastruktur dibatasi dan diaudit |
| Publik | Melihat profil calon, quick count selama voting, dan hasil resmi setelah penetapan |

Satu orang dapat memiliki peran pemilih dan petugas. Sistem tetap memisahkan tindakan administrasi dari penggunaan hak suara pribadi. Kandidat tidak memerlukan akun khusus pada MVP; panitia memasukkan profilnya.

## 4. Matriks pemilihan

Matriks berikut menjadi hak pilih awal mahasiswa dan dosen sesuai konfirmasi pemilik proyek pada 14 September 2026 (D-01). Admin berwenang menyesuaikan kontes yang diizinkan sebelum pembekuan, dengan alasan dan audit. Pihak akademik tetap perlu menetapkan kelayakan masuk DPT.

| Jurusan mahasiswa/dosen di DPT | Pasangan BEM | Pasangan MPM | Ketua Hima | Wakil ketua Hima |
| --- | --- | --- | --- | --- |
| Keperawatan | Ya | Ya | Keperawatan | Keperawatan |
| Kebidanan | Ya | Ya | Kebidanan | Kebidanan |
| Kesehatan Gigi | Ya | Ya | Kesehatan Gigi | Kesehatan Gigi |
| Ortotik Prostetik | Ya | Ya | Ortotik Prostetik | Ortotik Prostetik |

Secara awal setiap mahasiswa dan dosen memperoleh empat kontes. Admin dapat menambah atau mencabut hak kontes tertentu untuk pemilih tertentu atau kelompok terpilih sebelum DPT dibekukan. Contohnya, pemilih Keperawatan tidak dapat memilih Hima Kebidanan kecuali admin secara eksplisit memberi hak tersebut. Backend selalu memeriksa hak yang tersimpan; mengetahui alamat halaman tidak memberikan hak suara. Sistem tidak memberikan seluruh sepuluh hak suara secara otomatis.

## 5. Cakupan MVP

Termasuk pengelolaan periode, sepuluh kontes, input manual dan impor Excel/CSV pemilih mahasiswa/dosen, pengaturan hak pilih oleh admin, akun pemilih, input profil pasangan BEM/MPM dan calon individu Hima melalui website, voting satu opsi per kontes, status partisipasi, quick count selama voting, rekap final setelah penutupan, publikasi hasil, ekspor agregat, audit administrasi, dan panduan operasional.

Tidak termasuk aplikasi mobile native, pendaftaran calon mandiri, forum kampanye, voting berbobot, pemeringkatan calon, pembagian kursi MPM, pemilihan multiopsi, integrasi akademik otomatis, serta verifikasi kriptografis ujung ke ujung. BEM dan MPM menggunakan satu pasangan sebagai satu opsi. Setiap Hima memiliki dua surat suara independen untuk ketua dan wakil ketua; memilih ketua tidak otomatis memilih wakilnya.

### Batasan teknologi

Pemilik proyek menyetujui full-stack Nuxt 4, menggantikan pilihan awal Nuxt 3. Halaman publik, pemilih, dan admin beserta API berjalan dalam satu project Nuxt 4. Kode server tetap memvalidasi identitas, hak pilih, transaksi suara, dan unggahan. Deployment menggunakan VPS dengan panel EasyPanel sesuai pilihan pemilik proyek. Database ditetapkan PostgreSQL 17 dengan patch terpelihara. Login menggunakan NIM untuk mahasiswa atau NIP lokal dari panitia untuk dosen, beserta password yang dibagikan panitia; tanpa OTP, email, atau SSO kampus. VPS memiliki 4 core CPU dan RAM 8 GB yang berbagi dengan project lain; sasaran sekitar 600 pemilih; kebutuhan integritas suara tetap berlaku. Struktur dan pembagian tanggung jawab terdapat pada [SDD](SDD.md).

## 6. Aturan bisnis yang diusulkan

| ID | Aturan |
| --- | --- |
| BR-01 | Hanya identitas yang terverifikasi dan memiliki hak suara dalam DPT periode tersebut yang dapat memilih |
| BR-02 | Satu pemilih hanya boleh menggunakan satu hak suara pada tiap kontes yang memenuhi syarat |
| BR-03 | Satu kiriman hanya berlaku untuk satu kontes dan satu opsi calon yang aktif di kontes tersebut |
| BR-04 | Suara yang sudah diterima tidak dapat diubah, dibatalkan, atau direset oleh pemilih maupun admin aplikasi |
| BR-05 | Voting diterima jika status periode OPEN dan waktu otoritatif server berada pada rentang mulai inklusif sampai selesai eksklusif |
| BR-06 | DPT, hak suara, format kontes, dan calon dibekukan ketika periode masuk READY. Perubahan sebelum OPEN harus kembali ke DRAFT dan memperoleh persetujuan ulang |
| BR-07 | Halaman quick count menampilkan perolehan calon selama OPEN dengan pembaruan berkala. Hasil ini berlabel sementara dan terpisah dari hasil resmi setelah penutupan |
| BR-08 | Publikasi hasil resmi memerlukan penutupan, rekonsiliasi yang cocok, dan persetujuan petugas berbeda |
| BR-09 | Kontes yang belum dipilih tetap dapat diisi hingga waktu berakhir. Meninggalkan kontes bukan surat suara abstain |
| BR-10 | Suara seri atau masalah penetapan pemenang diserahkan kepada panitia; sistem tidak menebak pemenang |
| BR-11 | Gangguan tidak boleh ditangani dengan menghapus suara atau membuka hak suara yang sudah digunakan |
| BR-12 | Bukti penerimaan hanya menyatakan status suara diterima; tidak mencantumkan calon pilihan atau tautan ke surat suara |
| BR-13 | Jenis pemilih mahasiswa/dosen tidak otomatis memberi akses admin. Hak pilih per kontes diatur admin di DRAFT, dengan pratinjau dampak dan alasan perubahan |
| BR-14 | Input manual dan impor memakai validasi dan identitas yang sama. Impor ulang tidak boleh membuat akun/hak ganda atau menimpa hak yang sudah diatur admin secara diam-diam |

## 7. Alur utama

### Persiapan panitia

1. Panitia membuat periode dan sepuluh kontes sesuai aturan yang disepakati.
2. Petugas menambah pemilih mahasiswa/dosen lewat form atau mengimpor Excel/CSV, lalu memeriksa duplikasi identitas, status aktif, dan pemetaan jurusan.
3. Admin meninjau hak awal pasangan BEM, pasangan MPM, ketua Hima, dan wakil ketua Hima sesuai jurusan, lalu menyesuaikan hak per orang atau massal. Panitia menginput pasangan BEM/MPM atau calon individu Hima, mengunggah foto yang sesuai, serta mengisi moto, visi, misi, dan jadwal WIB. Petugas menetapkan password akun dan membagikannya langsung kepada pemilih.
4. Sistem memvalidasi kesiapan, membekukan konfigurasi pada READY, dan mencatat persetujuan pembukaan dari akun berbeda.
5. Periode dibuka sesuai jadwal apabila persetujuan dan validasi tetap berlaku.

### Pemilih

1. Pemilih memilih jenis akun mahasiswa/dosen, lalu login dengan NIM/NIP lokal dan password dari panitia. Akun petugas menggunakan login admin terpisah secara peran.
2. Dashboard menampilkan kontes yang berhak dipilih beserta status belum memilih atau suara diterima.
3. Pemilih membaca nomor urut, nama pasangan atau individu, foto, moto, visi, misi, dan program tambahan bila tersedia.
4. Pemilih memilih satu opsi, lalu meninjau halaman konfirmasi yang menyebut kontes dan calon.
5. Pemilih mengirim suara. Setelah server mengonfirmasi commit, aplikasi menampilkan suara diterima.
6. Pemilih dapat melanjutkan ke kontes lainnya, keluar, atau kembali sebelum waktu berakhir.

Jika koneksi putus setelah pengiriman, aplikasi menampilkan status belum dapat dipastikan dan memeriksa partisipasi dari server. Aplikasi tidak langsung menyatakan gagal atau mengajak pemilih memilih calon lain.

### Quick count selama voting

Halaman publik `/quick-count/:electionId` menampilkan total suara dan persentase tiap opsi pada sepuluh kontes, jumlah partisipasi, serta waktu pembaruan terakhir. Pembaruan diusulkan setiap 5 detik agar ringan; bukan pembaruan seketika per suara. Label yang ditampilkan: **Hasil sementara, belum ditetapkan panitia**. Saat koneksi putus, data lama tetap terlihat dengan penanda belum diperbarui.

Angka quick count berasal dari seluruh suara yang diterima aplikasi, bukan estimasi sampel. Tidak ada identitas pemilih, daftar pemilih terakhir, atau rincian suara individual.

### Penutupan dan hasil

1. Server menolak pengiriman baru pada waktu selesai meskipun tampilan browser belum diperbarui.
2. Sistem menutup periode dan menghitung rekap dari suara yang sudah commit.
3. Pengawas memeriksa jumlah surat suara, partisipasi, DPT, dan hasil per calon.
4. Panitia menyelesaikan tindak lanjut ketidaksesuaian atau sengketa sebelum publikasi.
5. Petugas berbeda menyetujui publikasi. Publik melihat rekap dan status penetapan resmi yang diisi panitia.

## 8. Kebutuhan fungsional

| ID | Kebutuhan dan kriteria penerimaan |
| --- | --- |
| FR-01 | Sistem menyimpan periode, jadwal WIB, sepuluh kontes, dan aturan eligibility; jadwal selesai harus sesudah mulai |
| FR-02 | Impor Excel (.xlsx) dan CSV (.csv) pemilih menyediakan template, pratinjau, pemetaan kolom, laporan kesalahan per baris, dan ringkasan tambah/perbarui/lewati. Duplikasi identitas atau jurusan tidak dikenal memblokir finalisasi; impor ulang tidak menggandakan pemilih |
| FR-03 | Login memakai jenis pemilih + NIM/NIP lokal + password dari panitia. Tidak ada OTP, email, atau akun kampus. Password disimpan sebagai hash; login salah memberikan pesan umum. Akun tanpa hak suara tetap tidak dapat memilih; tidak ada registrasi publik |
| FR-04 | Dashboard hanya menampilkan hak suara pengguna dari server, termasuk ketika pemilih juga memiliki peran admin |
| FR-05 | Panitia menginput calon lewat website. BEM/MPM wajib dua nama (ketua dan wakil) dan foto pasangan; setiap kontes ketua/wakil Hima wajib satu nama dan foto individu. Semua opsi wajib nomor urut unik per kontes, moto, visi, dan misi sebelum READY. Program tambahan opsional; form menyediakan pratinjau dan penggantian foto |
| FR-06 | Pemilih wajib meninjau pilihan sebelum mengirim. Server menolak opsi dari kontes lain atau opsi tidak aktif |
| FR-07 | Pengiriman suara bersifat atomik dan tahan kiriman bersamaan; dua permintaan untuk satu hak suara menghasilkan tepat satu surat suara |
| FR-08 | Refresh, pengiriman ulang, atau timeout tidak menggandakan suara. Status partisipasi dapat diperiksa tanpa mengungkap calon |
| FR-09 | Quick count menampilkan perolehan tiap calon dan partisipasi saat OPEN, dengan label sementara, waktu pembaruan, dan penanganan data kedaluwarsa. Angka hanya mencakup transaksi yang sudah commit |
| FR-10 | Rekap setelah CLOSED memuat suara tiap opsi, total suara, jumlah eligible, partisipasi, dan selisih rekonsiliasi. Selisih bukan nol memblokir publikasi |
| FR-11 | Publik dapat membaca quick count sementara selama voting; endpoint hasil resmi hanya tersedia saat PUBLISHED. Ekspor membedakan rekap sementara dan resmi serta menyertakan agregat, versi/waktu penghitungan, dan label status |
| FR-12 | Sistem mengaudit input manual/impor DPT, perubahan hak pilih, perubahan calon, peran, jadwal, persetujuan, perubahan status, ekspor, dan publikasi tanpa payload pilihan pemilih |
| FR-13 | Panitia dapat menetapkan/reset password satu akun atau membuat password awal massal, lalu membagikannya langsung. Reset mencabut sesi lama, diaudit, dan tidak mengubah partisipasi/hak suara. Sistem tidak menyediakan pembacaan kembali password lama |
| FR-14 | Panitia dapat menjeda voting saat insiden dengan alasan wajib. Pemulihan membutuhkan dua petugas dan tidak boleh melewati waktu selesai |
| FR-15 | Petugas menambah/mengubah pemilih melalui form: jenis mahasiswa/dosen, jenis dan nomor identitas, nama, jurusan, serta status aktif. Daftar dapat dicari berdasarkan nama/identitas dan difilter berdasarkan jenis/jurusan/status. Validasi sama dengan impor; data hanya diedit saat DRAFT |
| FR-16 | Halaman admin hak pilih menampilkan sepuluh kontes sebagai pilihan per pemilih, menyediakan filter jenis/jurusan dan pemilihan massal, serta aksi beri/cabut hak pada kontes tertentu. Sebelum simpan, tampilkan daftar sasaran, jumlah hak ditambah/dicabut, dan alasan wajib. Hak nol ditandai; perubahan tercatat di audit dan ditolak setelah pembekuan |

## 9. Kebutuhan nonfungsional

Jumlah pemilih sekitar 600 dan kapasitas VPS 4 core/8 GB dikonfirmasi pengguna. Target di bawah adalah anggaran dan kriteria uji sementara; penggunaan aktual serta sisa resource VPS belum diukur.

| ID | Target | Cara verifikasi |
| --- | --- | --- |
| NFR-01 | Data 600 pemilih dengan 2.400 hak awal; 100 sesi voting bersamaan, 10 pengiriman suara/detik selama 4 menit, dan 600 penonton quick count polling 5 detik: p95 voting ≤ 2 detik, error server < 1%, tanpa suara ganda | Uji beban campuran, retry, serta lonjakan 600 login; reset data hanya di lingkungan uji antar-skenario |
| NFR-02 | Restart proses aplikasi/database dengan volume tetap sehat tidak menghilangkan suara yang sudah diakui diterima. Kehilangan total VPS/disk tidak dijamin oleh topologi satu VPS | Uji crash/restart, durability commit, dan restore cadangan di lingkungan terisolasi |
| NFR-03 | Target layanan tersedia 99,9% selama jendela voting; target pemulihan insiden ≤ 30 menit | Monitoring dan simulasi pemulihan; kelayakan bergantung anggaran D-07 |
| NFR-04 | Pilihan tidak muncul pada log aplikasi, analitik, bukti penerimaan, atau ekspor identitas | Pemeriksaan log, izin akses, dan ekspor dengan data uji |
| NFR-05 | Seluruh alur pemilih dapat dioperasikan lewat keyboard, berlabel untuk pembaca layar, serta tidak bergantung hanya pada warna | Uji manual keyboard, pembaca layar, dan ponsel |
| NFR-06 | Koneksi terenkripsi, sesi terlindungi, autentikasi ulang password petugas pada tindakan kritis, dan validasi izin pada server | Uji akses lintas peran dan tinjauan konfigurasi sebelum penggunaan riil |

Kerahasiaan MVP membatasi akses pengguna dan admin aplikasi. Rancangan ini belum menjamin operator database tidak dapat menghubungkan suara dengan identitas melalui metadata transaksi. Quick count pada kelompok kecil juga dapat membantu inferensi pilihan melalui perubahan angka, dan panitia yang mengetahui password berada dalam batas kepercayaan. Kebutuhan yang lebih kuat memerlukan keputusan D-12 dan perubahan arsitektur.

Anggaran runtime awal: satu proses aplikasi dengan batas 512 MiB RAM/1 vCPU dan PostgreSQL dengan batas 512 MiB RAM/0,5 vCPU. Total batas RAM 1 GiB tidak mencakup OS, EasyPanel, cache filesystem, build, dan project lain. Jika uji beban tidak lulus, sesuaikan limit atau kapasitas sebelum digunakan; angka tersebut bukan jaminan konsumsi.

Quick count menggunakan cache agregat pendek dan polling; tidak membutuhkan Redis, WebSocket, atau worker terpisah pada MVP. Target data terlihat dalam sekitar 10 detik pada jaringan normal. Build dilakukan di luar jam voting, idealnya di mesin pengembangan/CI.

## 10. Halaman dan keadaan penting

Arahan visual yang dikonfirmasi: modern light dengan hijau `#2A6B5C`, putih hangat `#FFF9F2`, dan font Inter. Berlaku pada halaman publik, pemilih, quick count, dan admin. Detail arahan berada di [DESIGN](../DESIGN.md); pemeriksaan aksesibilitas tetap mengikuti NFR-05.

| Area | Halaman | Keadaan yang wajib ditangani |
| --- | --- | --- |
| Publik | Informasi periode, daftar/profil calon, quick count, hasil resmi | Belum dibuka, hasil sementara, dijeda, data kedaluwarsa, hasil resmi belum tersedia |
| Pemilih | Login, dashboard, surat suara, konfirmasi, status penerimaan | DPT tidak ditemukan, sesi habis, tidak berhak, sudah memilih, jaringan putus, voting dijeda |
| Panitia | Periode, daftar/form pemilih, impor Excel/CSV, pengaturan hak pilih, form pasangan/individu calon dan unggah foto, kesiapan, statistik, hasil, audit | Impor salah/duplikat, unggahan gagal, hak kosong, perubahan massal, konfigurasi dibekukan, persetujuan tertunda, rekonsiliasi gagal |

## 11. Tahapan dan kelayakan peluncuran

Urutan pelaksanaan dirinci di [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md) dan pekerjaan dilacak di [TASKLIST](TASKLIST.md). Fase mencakup fondasi, antarmuka dasar, akun, periode/calon, pemilih/hak pilih, voting, quick count/hasil, validasi, serta deployment dan serah terima. Tiap fase memiliki dependensi dan kriteria selesai.

Penggunaan untuk pemilihan riil mensyaratkan aturan final, DPT yang disahkan, seluruh FR lulus uji, kapasitas yang terverifikasi, simulasi pemulihan berhasil, tidak ada temuan keamanan kritis/tinggi yang terbuka, dan penanggung jawab operasional yang ditunjuk. Jadwal pengembangan dan biaya ditentukan setelah keputusan awal selesai.
