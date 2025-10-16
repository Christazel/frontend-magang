"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api";

interface Presensi {
  _id: string;
  tanggal: string;
  jamMasuk?: string;
  jamKeluar?: string;
  lokasiMasuk?: string;
  lokasiKeluar?: string;
  user?: {
    name: string;
    email: string;
  };
}

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
      if (!token) return;

      const res = await fetch(`${API_BASE}/presensi/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      const result = await res.json();
      if (!res.ok) {
        setError(result?.msg || "Gagal mengambil data presensi");
        return;
      }

      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      setError("Terjadi kesalahan saat mengambil data presensi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresensiAdmin();
  }, []);

  // 🔎 Kelompokkan data berdasarkan user
  const groupedData = data.reduce((acc: any, item) => {
    const userId = item.user?.email || "unknown";
    if (!acc[userId]) {
      acc[userId] = {
        user: item.user,
        presensi: [],
      };
    }
    acc[userId].presensi.push(item);
    return acc;
  }, {});

  // Filter berdasarkan nama
  const filteredUsers = Object.values(groupedData).filter((group: any) =>
    group.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />
        <main className="flex-1 mt-14 px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h1 className="text-xl font-bold text-gray-800 mb-4">
                Rekap Presensi Peserta
              </h1>

              {/* 🔎 Search */}
              <input
                type="text"
                placeholder="Cari nama peserta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-3 mb-6 border border-gray-400 rounded-md  text-gray-900 placeholder-gray-500  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              {error && (
                <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
                  {error}
                </div>
              )}

              {loading ? (
                <p className="text-gray-600">Memuat data...</p>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-6">
                  {filteredUsers.map((group: any) => (
                    <div
                      key={group.user?.email}
                      className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-5"
                    >
                      {/* Header User */}
                      <h2 className="text-lg font-semibold text-blue-700">
                        {group.user?.name || "Tanpa Nama"}
                      </h2>
                      <p className="text-sm text-gray-600 mb-3">
                        {group.user?.email}
                      </p>

                      {/* Presensi List */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm text-gray-800">
                          <thead>
                            <tr className="bg-gray-200 text-gray-900">
                              <th className="border border-gray-300 p-2">Tanggal</th>
                              <th className="border border-gray-300 p-2">Jam Masuk</th>
                              <th className="border border-gray-300 p-2">Jam Keluar</th>
                              <th className="border border-gray-300 p-2">Lokasi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.presensi.map((p: Presensi) => (
                              <tr
                                key={p._id}
                                className="bg-white hover:bg-gray-50 transition-colors"
                              >
                                <td className="border border-gray-300 p-2">
                                  {p.tanggal
                                    ? new Date(p.tanggal).toLocaleDateString("id-ID")
                                    : "-"}
                                </td>
                                <td className="border border-gray-300 p-2">
                                  {p.jamMasuk || "-"}
                                </td>
                                <td className="border border-gray-300 p-2">
                                  {p.jamKeluar || "-"}
                                </td>
                                <td className="border border-gray-300 p-2 text-xs space-y-1">
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
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Tidak ada data presensi.</p>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
