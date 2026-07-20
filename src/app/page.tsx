"use client";

import { ArrowRight, Users, FileText, CalendarCheck, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      icon: CalendarCheck,
      title: "Presensi Digital",
      desc: "Absensi masuk & keluar dengan validasi lokasi GPS secara otomatis.",
    },
    {
      icon: FileText,
      title: "Laporan Harian",
      desc: "Upload laporan kegiatan magang dan pantau status persetujuannya.",
    },
    {
      icon: Users,
      title: "Manajemen Peserta",
      desc: "Admin dapat memantau data dan keaktifan seluruh peserta magang.",
    },
    {
      icon: Shield,
      title: "Aman & Terstruktur",
      desc: "Data tersimpan dengan aman dan hanya dapat diakses oleh pihak berwenang.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ── Navbar ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src="/images/Logo-dikbud.png"
                alt="Logo Dinas Pendidikan"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-gray-800">Dinas Pendidikan</p>
              <p className="text-[10px] text-gray-500">Kabupaten Melawi</p>
            </div>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #0d9488, #0f766e)",
            }}
          >
            Masuk
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1">
        <section
          className="py-16 md:py-24 px-5 text-center"
          style={{
            background:
              "linear-gradient(160deg, #0f4c35 0%, #0d9488 60%, #0f766e 100%)",
          }}
        >
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-6 shadow-xl bg-white/10 p-1">
              <Image
                src="/images/Logo-dikbud.png"
                alt="Logo Dinas"
                width={60}
                height={60}
                className="object-contain rounded-xl"
                priority
              />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
              Sistem Informasi Magang
            </h1>
            <p className="text-teal-100 font-semibold mt-1 text-base">
              Dinas Pendidikan Kabupaten Melawi
            </p>

            <p className="mt-5 text-white/75 text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
              Platform digital untuk mengelola presensi dan laporan kegiatan
              peserta magang secara terpusat, mudah, dan transparan.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base transition-all duration-200 hover:scale-105"
                style={{
                  background: "rgba(255,255,255,1)",
                  color: "#0d9488",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                }}
              >
                Masuk ke Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base text-white transition-all duration-200 hover:bg-white/10"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                }}
              >
                Daftar Akun Baru
              </Link>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-14 px-5 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Apa yang bisa dilakukan di platform ini?
              </h2>
              <p className="text-gray-500 text-sm mt-2">
                Fitur utama yang tersedia untuk peserta dan admin.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(13,148,136,0.08)",
                        color: "#0d9488",
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 mb-1">
                        {f.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-5xl mx-auto px-5 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Kolom 1: Profil Instansi */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 p-0.5 flex-shrink-0">
                <Image
                  src="/images/Logo-dikbud.png"
                  alt="Logo Disdikbud"
                  width={40}
                  height={40}
                  className="object-contain rounded-lg"
                />
              </div>
              <div className="leading-tight">
                <p className="text-white font-bold text-sm">Disdikbud Melawi</p>
                <p className="text-gray-400 text-[11px]">Kalimantan Barat</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Instansi pemerintah daerah yang bertanggung jawab atas pengelolaan,
              pembinaan, dan pengembangan pendidikan serta kebudayaan di wilayah
              Kabupaten Melawi — dari jenjang PAUD, SD, hingga SMP.
            </p>
          </div>

          {/* Kolom 2: Kontak & Lokasi */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
              Informasi Kontak
            </h3>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li className="leading-relaxed">
                <span className="font-semibold text-gray-300">Alamat:</span><br />
                Jl. Baru / Jl. Provinsi Nanga Pinoh - Kota Baru, Km. 7,
                Desa Kelakik, Kec. Nanga Pinoh,<br />
                Kabupaten Melawi, Kalbar 79672
              </li>
              <li>
                <span className="font-semibold text-gray-300">Telepon:</span>{" "}
                <a href="tel:+625682020090" className="hover:text-teal-400 transition-colors">
                  +62 568 2020090
                </a>
              </li>
              <li>
                <span className="font-semibold text-gray-300">Faks:</span> (0568) 2020080
              </li>
              <li>
                <span className="font-semibold text-gray-300">Jam Kerja:</span><br />
                Senin – Jumat: 08.00 – 17.00 WIB<br />
                <span className="text-gray-500">Sabtu & Minggu Tutup</span>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Media Sosial & Tautan */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
              Ikuti Kami
            </h3>
            <ul className="space-y-3 text-xs text-gray-400">
              <li>
                <a
                  href="https://instagram.com/disdikbud.melawi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-teal-400 transition-colors"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  @disdikbud.melawi
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com/disdikbud.melawi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-teal-400 transition-colors"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Dinas Pendidikan Dan Kebudayaan Kab. Melawi
                </a>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-[11px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">Platform ini</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Sistem Informasi Magang — digunakan untuk mengelola
                presensi dan laporan peserta magang di lingkungan Disdikbud Melawi.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 py-4 px-5">
          <p className="text-center text-[11px] text-gray-600">
            &copy; {new Date().getFullYear()} Dinas Pendidikan dan Kebudayaan Kabupaten Melawi.
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
