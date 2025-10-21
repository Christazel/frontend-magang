"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Selalu pakai proxy app: /api
const API_BASE = "/api";

interface Presensi {
  _id: string;
  tanggal: string;
  jamMasuk?: string;
  jamKeluar?: string;
  lokasiMasuk?: string;
  lokasiKeluar?: string;
  user?: { name: string; email: string };
}

type Grouped = {
  user?: { name: string; email: string };
  presensi: Presensi[];
};

export default function RekapPresensiPage() {
  const [data, setData] = useState<Presensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchPresensiAdmin = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch(`${API_BASE}/presensi/admin`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      // Baca sebagai teks dulu agar error HTML tidak meledak di JSON.parse
      const txt = await res.text();
      let result: any = null;
      try {
        result = JSON.parse(txt);
      } catch {
        if (!res.ok) throw new Error(txt || "Gagal mengambil data presensi");
      }

      if (!res.ok) {
        throw new Error(result?.msg || "Gagal mengambil data presensi");
      }

      setData(Array.isArray(result) ? result : []);
    } catch (e: any) {
      setError(e?.message || "Terjadi kesalahan saat mengambil data presensi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresensiAdmin();
  }, []);

  // 🔎 Kelompokkan data berdasarkan user (memoized)
  const grouped = useMemo(() => {
    const acc: Record<string, Grouped> = {};
    for (const item of data) {
      const key = item.user?.email || "unknown";
      if (!acc[key]) acc[key] = { user: item.user, presensi: [] };
      acc[key].presensi.push(item);
    }
    return Object.values(acc);
  }, [data]);

  // Filter by nama (memoized)
  const filteredUsers = useMemo(
    () =>
      grouped.filter((g) =>
        (g.user?.name || "").toLowerCase().includes(search.toLowerCase())
      ),
    [grouped, search]
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar collapsed otomatis di mobile (atur di komponen Sidebar) */}
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 mt-14 px-3 sm:px-5 lg:px-10 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow p-4 sm:p-6">
              {/* Header + Search sticky supaya mudah di mobile */}
              <div className="sticky -top-2 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-10 pb-3">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                  Rekap Presensi Peserta
                </h1>

                <div className="mt-3">
                  <label htmlFor="search" className="sr-only">
                    Cari nama peserta
                  </label>
                  <input
                    id="search"
                    type="text"
                    inputMode="search"
                    placeholder="Cari nama peserta…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 sm:py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Error / Loading */}
              {error && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="mt-6 space-y-3">
                  <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-24 bg-gray-200 rounded animate-pulse" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="mt-6 text-gray-600">Tidak ada data presensi.</p>
              ) : (
                <div className="mt-4 space-y-6">
                  {filteredUsers.map((group) => (
                    <section
                      key={group.user?.email || "unknown"}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5"
                    >
                      {/* Header User */}
                      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <div>
                          <h2 className="text-base sm:text-lg font-semibold text-blue-700">
                            {group.user?.name || "Tanpa Nama"}
                          </h2>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {group.user?.email}
                          </p>
                        </div>
                      </div>

                      {/* ====== Tampilan MOBILE (cards) ====== */}
                      <div className="md:hidden space-y-3">
                        {group.presensi.map((p) => (
                          <article
                            key={p._id}
                            className="rounded-lg bg-white shadow-sm border border-gray-200 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                {p.tanggal
                                  ? new Date(p.tanggal).toLocaleDateString("id-ID")
                                  : "-"}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                Presensi
                              </span>
                            </div>

                            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
                              <div>
                                <dt className="text-gray-500">Jam Masuk</dt>
                                <dd className="font-medium text-gray-900">
                                  {p.jamMasuk || "-"}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-gray-500">Jam Keluar</dt>
                                <dd className="font-medium text-gray-900">
                                  {p.jamKeluar || "-"}
                                </dd>
                              </div>
                              <div className="col-span-2 mt-1 text-xs space-y-1">
                                {p.lokasiMasuk && (
                                  <p>
                                    <span className="font-semibold text-green-700">
                                      Masuk:
                                    </span>{" "}
                                    <a
                                      href={`https://www.google.com/maps?q=${p.lokasiMasuk}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 underline"
                                    >
                                      Lihat Lokasi
                                    </a>
                                  </p>
                                )}
                                {p.lokasiKeluar && (
                                  <p>
                                    <span className="font-semibold text-red-700">
                                      Keluar:
                                    </span>{" "}
                                    <a
                                      href={`https://www.google.com/maps?q=${p.lokasiKeluar}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 underline"
                                    >
                                      Lihat Lokasi
                                    </a>
                                  </p>
                                )}
                              </div>
                            </dl>
                          </article>
                        ))}
                      </div>

                      {/* ====== Tampilan DESKTOP (table) ====== */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse text-sm text-gray-800 bg-white rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-gray-200 text-gray-900">
                              <th className="p-3 text-left">Tanggal</th>
                              <th className="p-3 text-left">Jam Masuk</th>
                              <th className="p-3 text-left">Jam Keluar</th>
                              <th className="p-3 text-left">Lokasi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.presensi.map((p) => (
                              <tr
                                key={p._id}
                                className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                <td className="p-3">
                                  {p.tanggal
                                    ? new Date(p.tanggal).toLocaleDateString("id-ID")
                                    : "-"}
                                </td>
                                <td className="p-3">{p.jamMasuk || "-"}</td>
                                <td className="p-3">{p.jamKeluar || "-"}</td>
                                <td className="p-3 text-xs space-y-1">
                                  {p.lokasiMasuk && (
                                    <p>
                                      <span className="font-semibold text-green-700">
                                        Masuk:
                                      </span>{" "}
                                      <a
                                        href={`https://www.google.com/maps?q=${p.lokasiMasuk}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                        title={p.lokasiMasuk}
                                      >
                                        Lihat Lokasi
                                      </a>
                                    </p>
                                  )}
                                  {p.lokasiKeluar && (
                                    <p>
                                      <span className="font-semibold text-red-700">
                                        Keluar:
                                      </span>{" "}
                                      <a
                                        href={`https://www.google.com/maps?q=${p.lokasiKeluar}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                        title={p.lokasiKeluar}
                                      >
                                        Lihat Lokasi
                                      </a>
                                    </p>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
