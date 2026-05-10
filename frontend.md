PRD Frontend: Pemilihan Raya MPM Poltekkes Jakarta 1
1. Identitas Visual & Desain
Font Utama: Plus Jakarta Sans (Sans-serif yang modern, bersih, dan profesional).

Palet Warna:

Primary: Biru Navy/Deep Blue (Representasi institusi Poltekkes).

Secondary: Teal atau Hijau Soft (Kesehatan/Medis).

Accent: Kuning Emas (Simbol kepemimpinan).

Background: Off-white atau Light Gray untuk mengurangi kelelahan mata.

Style: Modern Minimalist, Card-based UI, High Contrast untuk keterbacaan Visi & Misi.

2. Struktur Navigasi & Halaman
A. Landing Page (Public)
Hero Section: Judul "Pemilihan Raya Mahasiswa", Logo Poltekkes Jakarta 1, dan CTA (Call to Action) "Mulai Memilih".

Informasi Section: Statistik singkat (Jumlah Organisasi, Total Pemilih) dan Tata Cara Voting.

Footer: Hak cipta MPM Poltekkes Jakarta 1 dan tautan media sosial.

B. Halaman Login (Universal)
Single Entry Point: Satu form login untuk User dan Admin. Sistem akan melakukan redirect berdasarkan role setelah sukses login.

Form Field: Username/NIM dan Password.

Feedback UI: Animasi loading saat autentikasi dan Alert jika data salah.

C. Voter Dashboard (Protected)
Grid Pemilihan: Menampilkan kartu-kartu organisasi (BEM, MPM, Hima).

Dynamic Visibility: Kartu pemilihan hanya muncul jika Admin memberikan hak pilih kepada user tersebut.

Status Badges:

Belum Memilih (Warna Abu-abu/Biru).

Sudah Memilih (Warna Hijau + Icon Checkmark).

Empty State: Pesan jika tidak ada pemilihan yang tersedia untuk user tersebut.

D. Bilik Suara (Voting Modal/Page)
Candidate Cards:

Foto Ketua & Wakil berdampingan.

Nomor Urut yang mencolok.

Tombol "Lihat Visi-Misi" (Membuka Modal Detail).

Detail Modal: Teks Visi & Misi yang terstruktur menggunakan bullet points.

Konfirmasi Pilihan: Pop-up konfirmasi "Apakah Anda yakin memilih Paslon X?" sebelum data dikirim ke server.

E. Admin Dashboard (Protected)
Sidebar Navigation: Dashboard, Manajemen User, Manajemen Kandidat, Hasil Suara, Pengaturan.

User Management Table: Daftar user dengan kolom "Daftar Hak Pilih" (Tampilan Tag/Badges).

Quick Action: Tombol "Add User" yang membuka modal input data.

3. Spesifikasi Teknis Frontend
Framework & Library
Framework: Next.js (App Router).

Font: @next/font/google untuk integrasi Plus Jakarta Sans.

Icons: Lucide-React atau HeroIcons.

Component Library: Shadcn/UI (sangat disarankan untuk konsistensi komponen seperti Dialog, Table, dan Button).

State Management: Zustand (untuk menyimpan session voting sementara).

Validation: Zod + React Hook Form.

Konfigurasi Font (Next.js)
JavaScript
// layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-jakarta',
})

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="font-sans"> 
        {children}
      </body>
    </html>
  )
}
4. Fitur Interaktif (User Experience)
Skeleton Loading: Tampilan placeholder saat data kandidat atau profil sedang diambil dari API.

Responsive Design: Optimasi khusus untuk Google Chrome Mobile dan Safari (iPhone), mengingat mayoritas mahasiswa akan memilih lewat HP.

Animate Presence: Transisi antar halaman yang halus (menggunakan framer-motion).

Toast Notifications: Notifikasi sukses setelah berhasil memberikan suara.

5. Keamanan Frontend
Route Guard: Middleware Next.js untuk mencegah Voter masuk ke halaman Admin.

Anti-Double Click: Tombol "Vote" akan otomatis disable setelah diklik sekali untuk mencegah pengiriman data ganda.

Session Timeout: Otomatis logout jika user tidak aktif dalam waktu tertentu.

6. Contoh Alur UI untuk Hak Pilih (User Story)
Input: User Login (NIM Mahasiswa Keperawatan).

Frontend Logic: Frontend memanggil /api/user/permissions.

Output UI: Dashboard hanya me-render 3 Card: MPM, BEM, dan Hima Keperawatan. Card Hima Kebidanan, Ortotik, dan Gigi tidak akan muncul di DOM.