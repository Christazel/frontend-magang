# 🚨 Hasil Audit UX & Flow: Sistem Informasi Magang

Dokumen ini berisi analisis *User Experience* (UX) dan alur sistem saat ini. Tujuannya adalah mengidentifikasi potensi kebingungan dari sisi Peserta maupun Admin, serta rekomendasi fitur prioritas yang **wajib** ditambahkan sebelum rilis ke pengguna akhir.

---

## 1. Celah Kebingungan Peserta (Peserta's Gaps)

### A. "Saya sakit hari ini, bagaimana cara absennya?"
- **Flow Saat Ini:** Di halaman *Presensi*, peserta hanya melihat tombol "Presensi Masuk" dan "Presensi Keluar" menggunakan GPS. Di Dashboard memang ada statistik "Sakit" dan "Izin", tetapi **tidak ada tombol/form untuk mengajukannya**.
- **Solusi (Wajib):** Tambahkan tombol **"Ajukan Izin/Sakit"** di halaman Presensi. Peserta bisa memilih rentang tanggal, alasan (Sakit/Izin), dan mengunggah foto surat dokter/keterangan.

### B. "Apakah laporan saya sudah diperiksa? Kenapa disuruh revisi?"
- **Flow Saat Ini:** Saat Admin mengubah status laporan menjadi "Revisi" dan memberi catatan, peserta **tidak mendapat notifikasi apa-apa**. Mereka harus menebak dan sering-sering mengecek menu "Laporan".
- **Solusi (Wajib):** Tambahkan **"Banner Alert"** atau notifikasi di Dashboard Peserta jika ada laporan yang statusnya *Revisi*, misalnya: *"1 Laporan Anda dikembalikan untuk direvisi."*

### C. "Saya lupa password saya!"
- **Flow Saat Ini:** Tidak ada fitur atau petunjuk apa pun bagi user jika mereka lupa password.
- **Solusi (Wajib):** 
  - Tambahkan teks di halaman Login: *"Lupa Password? Hubungi Admin Instansi Anda."*
  - Di halaman Admin (Manajemen Peserta), tambahkan tombol **"Reset Password"** yang akan mengembalikan password peserta ke *default* (misal: `123456`).

---

## 2. Celah Kebingungan Admin (Admin's Gaps)

### A. "Ada orang iseng mendaftar (Register), kok bisa langsung masuk?"
- **Flow Saat Ini:** Siapapun yang tahu URL `/register` bisa membuat akun dan langsung berhasil login ke dashboard Peserta.
- **Solusi (Wajib):** Tambahkan status persetujuan pada akun. Setelah mendaftar, akun memiliki status *Pending*. Admin harus menekan tombol **"Approve"** di halaman Manajemen Peserta sebelum akun tersebut bisa digunakan untuk login.

### B. "GPS Peserta error, saya harus bantu absen manual."
- **Flow Saat Ini:** Halaman "Rekap Presensi" Admin bersifat *Read-only*. Admin tidak bisa mengubah atau menginput kehadiran secara manual jika perangkat (HP) peserta bermasalah.
- **Solusi (Wajib):** Sediakan opsi/tombol **"Edit / Tambah Kehadiran Manual"** di dalam baris data tabel Rekap Presensi untuk hak akses Admin.

### C. "Feedback vs Catatan Laporan — Apa bedanya?"
- **Flow Saat Ini:** Admin memiliki menu "Kirim Feedback" (secara global), tetapi juga punya input "Catatan" saat me-review Laporan. Admin mungkin bingung kapan harus menggunakan yang mana.
- **Solusi (UX Texting):** Perjelas penamaan menu agar lebih intuitif:
  - Ubah teks pada Laporan menjadi: *"Catatan Revisi Dokumen"*
  - Ubah teks pada Menu Feedback menjadi: *"Pesan & Evaluasi Kinerja (General)"*

---

## 💡 Prioritas Aksi (Next Steps)

Untuk menjadikan sistem ini 100% siap digunakan (Production-Ready) tanpa membingungkan user, prioritaskan penambahan **3 Fitur Utama** berikut:

1. **Form Pengajuan Izin / Sakit** (Peserta) & Fitur **Approval Izin** (Admin).
2. **Edit Kehadiran Manual** (Admin).
3. **Approval Status Akun Baru** (Admin).
