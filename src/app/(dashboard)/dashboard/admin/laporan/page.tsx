"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type LaporanType = {
  file: string;
  _id: string;
  judul: string;
  deskripsi: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
};

// 🔧 Selalu gunakan proxy Vercel
const API_BASE = "/api";

export default function LaporanAdminPage() {
  const [laporanList, setLaporanList] = useState<LaporanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const getLaporanList = async () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch(`${API_BASE}/laporan/admin`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal mengambil data laporan");
        const data: LaporanType[] = await res.json();
        setLaporanList(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("❌ Gagal memuat laporan:", err);
          setErrorMsg("Tidak dapat memuat data. Coba muat ulang.");
        }
      } finally {
        setLoading(false);
      }
    };

    getLaporanList();
    return () => controller.abort();
  }, []);

  // 🔎 Filter dan format tanggal stabil
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return laporanList.filter((lap) => {
      const keywordMatch =
        !q ||
        lap.user.name.toLowerCase().includes(q) ||
        lap.judul.toLowerCase().includes(q);

      const tanggalMatch = filterTanggal
        ? new Date(lap.createdAt).toLocaleDateString("sv-SE") === filterTanggal
        : true;

      return keywordMatch && tanggalMatch;
    });
  }, [laporanList, search, filterTanggal]);

  // 👥 Kelompokkan per user + urutkan nama
  const { laporanPerUser, sortedEmails } = useMemo(() => {
    const perUser: Record<string, LaporanType[]> = {};
    for (const lap of filteredList) {
      const key = lap.user?.email || "unknown";
      if (!perUser[key]) perUser[key] = [];
      perUser[key].push(lap);
    }
    const emails = Object.keys(perUser).sort((a, b) => {
      const na = perUser[a]?.[0]?.user?.name || "";
      const nb = perUser[b]?.[0]?.user?.name || "";
      return na.localeCompare(nb, "id");
    });
    return { laporanPerUser: perUser, sortedEmails: emails };
  }, [filteredList]);

  const clearFilters = () => {
    setSearch("");
    setFilterTanggal("");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar />
      {/* konten utama */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />

        {/* Filter bar lengket agar mudah dipakai di mobile */}
        <div
          className="sticky top-16 z-30 bg-gray-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 border-b"
          role="region"
          aria-label="Filter laporan"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="search" className="sr-only">
                  Cari nama peserta atau judul
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Cari nama peserta / judul file…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:w-56">
                <label htmlFor="date" className="sr-only">
                  Filter tanggal
                </label>
                <input
                  id="date"
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Bersihkan
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
            <h1 className="text-2xl font-bold tracking-tight mb-4">
              Daftar Laporan Mahasiswa
            </h1>

            {/* Status */}
            {loading && (
              <div
                className="space-y-3"
                aria-live="polite"
                aria-busy="true"
                role="status"
              >
                <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-gray-200" />
                <div className="h-40 w-full animate-pulse rounded-lg bg-gray-200" />
                <div className="h-40 w-full animate-pulse rounded-lg bg-gray-200" />
              </div>
            )}

            {!loading && errorMsg && (
              <div
                className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                role="alert"
              >
                {errorMsg}
              </div>
            )}

            {!loading && !errorMsg && sortedEmails.length === 0 && (
              <div className="rounded-lg border bg-white p-6 text-sm">
                Tidak ada laporan yang cocok dengan filter.
              </div>
            )}

            {/* Daftar per user */}
            {!loading &&
              !errorMsg &&
              sortedEmails.map((email) => {
                const laporans = laporanPerUser[email] || [];
                const displayName = laporans[0]?.user?.name || email;

                return (
                  <section key={email} className="mb-8">
                    <h2 className="text-lg font-semibold text-blue-700 mb-3 break-words">
                      {displayName}{" "}
                      <span className="font-normal text-gray-600">({email})</span>
                    </h2>

                    {/* Kartu (mobile-first) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:hidden">
                      {laporans.map((lap) => (
                        <article
                          key={lap._id}
                          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <p className="text-sm">
                            <span className="font-semibold">Judul:</span>{" "}
                            <span className="break-words">{lap.judul}</span>
                          </p>
                          <p className="text-sm mt-1">
                            <span className="font-semibold">Deskripsi:</span>{" "}
                            <span className="break-words">
                              {lap.deskripsi || "-"}
                            </span>
                          </p>
                          <p className="text-sm mt-1">
                            <span className="font-semibold">Tanggal:</span>{" "}
                            {new Date(lap.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <a
                            href={`${API_BASE}/laporan/download/${encodeURIComponent(
                              lap.file
                            )}`}
                            className="mt-3 inline-flex text-sm font-medium underline underline-offset-4 hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download
                          </a>
                        </article>
                      ))}
                    </div>

                    {/* Tabel (≥ md) */}
                    <div className="hidden md:block">
                      <div className="overflow-x-auto rounded-lg border bg-white">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-100 text-gray-900">
                            <tr className="border-b">
                              <th className="p-3 text-left w-1/3">Judul File</th>
                              <th className="p-3 text-left w-1/3">Deskripsi</th>
                              <th className="p-3 text-left w-1/4 whitespace-nowrap">
                                Tanggal Upload
                              </th>
                              <th className="p-3 text-left w-1/6">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {laporans.map((lap) => (
                              <tr
                                key={lap._id}
                                className="border-t hover:bg-gray-50"
                              >
                                <td className="p-3 align-top break-words">
                                  {lap.judul}
                                </td>
                                <td className="p-3 align-top break-words">
                                  {lap.deskripsi || "-"}
                                </td>
                                <td className="p-3 align-top whitespace-nowrap">
                                  {new Date(lap.createdAt).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    }
                                  )}
                                </td>
                                <td className="p-3 align-top">
                                  <a
                                    href={`${API_BASE}/laporan/download/${encodeURIComponent(
                                      lap.file
                                    )}`}
                                    className="font-medium text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Download
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                );
              })}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
