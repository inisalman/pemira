# SPEC — Halaman Riwayat Pemira (Arsip Periode Lama)

Status: DRAFT — menunggu approval
Terakhir diperbarui: 2026-10-14

## 1. Problem

PEMIRA versi baru (Nuxt) belum punya jejak historis. Pemira-era Laravel
(terakhir: PEMIRA 2025 oleh BEM, voting 9–16 Feb 2026) tidak terlihat di mana
pun di landing page. Panitia ingin ada halaman yang menampilkan periode-periode
pemira sebelumnya sebagai arsip publik.

## 2. Goal

- Halaman publik `/riwayat` di landing: daftar periode pemira terdahulu.
- Periode pertama yang diarsipkan: **PEMIRA 2025 (BEM)** — jendela voting
  9–16 Feb 2026.
- Format extensible: periode baru tinggal nambah entri JSON; blok hasil/paslon
  opsional (diisi belakangan kalau datanya dapat).

## 3. Non-goal

- TIDAK mengimpor data lama ke database voting (invariant integritas terjaga,
  quick count/elections list tidak tersentuh).
- TIDAK menampilkan data per-orang. File log lama memuat NIM individual (PII)
  — hanya agregat yang boleh tayang publik. CSV mentah TIDAK masuk repo.
- Tidak ada editing/CRUD arsip dari panel admin (statis via repo).

## 4. Sumber data & metodologi

Sumber: export log `riwayat_memilih.csv` dari sistem Laravel lama
(355 baris data, kolom: id, nim_username, waktu_memilih, pesan).

Validasi ketat (dipakai sebagai definisi resmi angka):
- NIM dinormalisasi (buang prefiks `P/p`), harus cocok `^\d{11,12}$`.
- Timestamp parse `YYYY-MM-DD - HH:MM:SS`.
- Baris yang gagal validasi dibuang: hasilnya 328 vote valid, 288 NIM unik.
- 2 baris ber-tanggal Maret 2026 gugur karena format tidak valid — dicatat
  sebagai catatan metodologi, bukan bagian grafik.

Angka agregat PEMIRA 2025:

- Total vote valid: 328 (288 pemilih unik)
- Jendela voting: 8 hari (9–16 Feb 2026)
- Vote per hari: 9 Feb = 96, 10 Feb = 77, 11 Feb = 7, 12 Feb = 25,
  13 Feb = 57, 14 Feb = 25, 15 Feb = 39, 16 Feb = 2
- Jam tersibuk: 20:00 (46 vote), 15:00 (36), 14:00 (27)

## 5. Arsitektur

- `scripts/build-riwayat.ts` — script Node (dev-only) yang membaca CSV mentah
  (path via argumen CLI, CSV tetap di luar repo), menjalankan validasi
  bagian 4, menulis JSON ke `app/data/riwayat.json`. Bisa dijalankan ulang
  kapan pun kalau ada export baru.
- `app/data/riwayat.json` — hasil generate, DI-COMMIT (bersih dari PII):
  satu file sumber kebenaran untuk halaman.
- `app/pages/riwayat.vue` — halaman statis (SPA sudah `ssr:false`), baca JSON
  langsung via import. Tanpa API baru, tanpa sentuhan DB.

## 6. Schema JSON

```jsonc
{
  "periods": [
    {
      "id": "pemira-2025",
      "name": "PEMIRA 2025",
      "organizer": "BEM",
      "votingStart": "2026-02-09",
      "votingEnd": "2026-02-16",
      "stats": {
        "validVotes": 328,
        "uniqueVoters": 288,
        "votingDays": 8
      },
      "daily": [
        { "date": "2026-02-09", "votes": 96 },
        { "date": "2026-02-10", "votes": 77 }
        // ... dst 8 hari
      ],
      "notes": "Data arsip sistem sebelumnya; validasi ketat 328/334 baris.",
      "results": null // diisi nanti kalau data paslon/suara dapat
    }
  ]
}
```

## 7. UI — halaman `/riwayat`

Layout desktop-first, tetap responsif mobile:

- Latar: sama dengan landing (cream/nuansa existing), section header pakai
  komponen `PageHeader` yang sudah ada.
- Judul: "Riwayat Pemira" + subjudul 1 kalimat ("Arsip periode pemilihan
  sebelumnya, sepanjang data yang tercatat.").
- Daftar periode: kartu vertikal (satu per periode), urut terbaru di atas.
- Isi kartu: badge tahun ("2025"), nama periode + penyelenggara
  ("PEMIRA 2025 — BEM"), rentang tanggal voting, 3 angka kunci
  (total vote, pemilih unik, lama voting).
- Chart batang partisipasi harian: SVG/CSS murni tanpa library, 8 batang,
  label tanggal pendek (9–16 Feb), nilai di atas batang.
- Blok "Hasil": kalau `results` masih null, tampil strip kecil
  "Data hasil belum diarsipkan." — bukan empty state besar.
- Footer kartu: catatan metodologi 1 baris (font kecil, abu).
- Nav: link "Riwayat" ditambah di navigasi landing (desktop menu + mobile).

## 8. Rollout

1. Commit spec ini → review Salman.
2. Implementasi script + JSON + halaman + nav link (1 commit kecil).
3. Build, deploy, verifikasi: `/riwayat` 200, chart tampil, landing normal.
4. Nanti kalau data paslon/hasil PEMIRA 2025 (atau periode lain) didapat,
   tinggal isi `results` + regenerate.

## 9. Open questions

- Data paslon + hasil suara PEMIRA 2025 belum ada — kalau nanti dapat
  (dokumentasi panitia/arsip IG), blok hasil diisi.
- Kalau ada periode lebih lama dari 2025, tinggal nambah entri.
