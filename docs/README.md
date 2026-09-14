# Dokumentasi PEMIRA

Versi 0.5 · 14 September 2026 · Draft untuk ditinjau

PEMIRA adalah aplikasi pemilihan raya Poltekkes Jakarta 1 dengan pemilih mahasiswa dan dosen.

| Dokumen | Isi |
| --- | --- |
| [PRD](PRD.md) | Cakupan, pengguna, aturan pemilihan, kebutuhan, kriteria penerimaan |
| [SDD](SDD.md) | Nuxt 4, PostgreSQL, data, API, transaksi, quick count, deployment dan pengujian |
| [Fase implementasi](IMPLEMENTATION_PLAN.md) | Urutan fase, dependensi, hasil, dan kriteria rilis |
| [Tasklist](TASKLIST.md) | Checklist pekerjaan per fase dengan ID dan acuan penerimaan |
| [Desain](../DESIGN.md) | Modern light, hijau #2A6B5C, putih hangat #FFF9F2, Inter |
| [Keputusan](DECISIONS.md) | Keputusan yang dikonfirmasi dan aturan operasional yang masih terbuka |

## Rancangan saat ini

- BEM dan MPM masing-masing satu pemilihan pasangan ketua/wakil.
- Setiap Hima memiliki pemilihan ketua dan wakil secara terpisah: Keperawatan, Kebidanan, Kesehatan Gigi, Ortotik Prostetik.
- Total sepuluh kontes; default empat hak suara per pemilih, bisa diatur admin.
- Calon diinput melalui website dengan foto pasangan/individu, moto, visi, dan misi.
- Pemilih diinput manual atau lewat Excel/CSV; login NIM/NIP lokal + password dari panitia, tanpa OTP/email/SSO.
- Halaman quick count menampilkan rekap sementara selama voting; hasil resmi ditetapkan terpisah.
- Stack disetujui Nuxt 4 full-stack. Database dipilih PostgreSQL 17. Target sekitar 600 pemilih pada VPS 4 core/8 GB dengan EasyPanel, bersama project lain.

Saat pemeriksaan awal, `frontend/` dan `backend/` kosong. Dokumen ini merupakan rancangan, bukan fitur yang sudah diimplementasikan. Nuxt 4 menggantikan keputusan awal Nuxt 3; struktur aplikasi berada dalam satu project. Penggunaan CPU/RAM dan kapasitas belum diukur. Baca PRD untuk aturan, SDD untuk implementasi, dan DECISIONS untuk hal yang perlu disahkan.

Pembaruan 0.5 mencatat arahan desain pengguna serta fase dan checklist implementasi. Seluruh task implementasi masih belum dikerjakan; penyusunan dokumen tidak dihitung sebagai penyelesaian fitur.

## Istilah

| Istilah | Makna |
| --- | --- |
| Periode | Satu penyelenggaraan PEMIRA |
| Kontes | Satu surat suara, misalnya pasangan BEM atau ketua Hima Keperawatan |
| Opsi calon | Satu pasangan untuk BEM/MPM atau satu individu untuk kontes Hima |
| DPT | Daftar pemilih tetap yang ditetapkan panitia |
| Hak suara | Izin seorang pemilih untuk menggunakan satu suara pada satu kontes |
| Partisipasi | Catatan penggunaan hak tanpa calon pilihan |
| Surat suara | Pilihan diterima, tanpa identitas pemilih pada record-nya |
| Quick count | Nama halaman rekap berjalan atas seluruh suara aplikasi yang sudah diterima; bukan estimasi sampel atau hasil resmi |
| PRD | Product Requirements Document |
| SDD | Software Design Document |
