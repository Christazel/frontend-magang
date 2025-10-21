"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// 🔧 Selalu gunakan proxy Vercel
const API_BASE = "/api";

interface Peserta {
  _id: string;
  name: string;
  email: string;
  hadir: number;
  tugas: number;
}

export default function ManajemenPesertaPage() {
  const { user } = useAuth();
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"hadir" | "tugas" | "name">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchPeserta = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token tidak ditemukan, silakan login ulang.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/users/admin/peserta`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.msg || "Gagal mengambil data peserta");
        setLoading(false);
        return;
      }

      setPeserta(data);
      setFilteredPeserta(data);
    } catch (_err) {
      console.error("❌ fetchPeserta error:", _err);
      setError("Terjadi kesalahan saat mengambil data peserta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeserta();
  }, []);

  // 🔍 Filter & Sort
  useEffect(() => {
    let filtered = peserta.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
    );

    filtered = [...filtered].sort((a, b) => {
      let valA: string | number = a[sortBy];
      let valB: string | number = b[sortBy];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredPeserta(filtered);
  }, [search, sortBy, sortOrder, peserta]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />
        <main className="flex-1 mt-14 px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Box */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-md">
              <h1 className="text-xl font-bold text-gray-800">
                Manajemen Peserta
              </h1>
              <p className="text-gray-600 mt-1">
                Monitoring kehadiran & tugas peserta
              </p>
            </div>

            {/* Error / Loading */}
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {loading && (
              <div className="bg-white p-6 rounded-lg shadow text-gray-600">
                Memuat data peserta...
              </div>
            )}

            {/* Filter & Sort */}
            {!loading && !error && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
                  <input
                    type="text"
                    placeholder="Cari nama atau email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-1/3 p-2 border rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="p-2 border rounded-md"
                    >
                      <option value="name">Nama</option>
                      <option value="hadir">Jumlah Hadir</option>
                      <option value="tugas">Jumlah Tugas</option>
                    </select>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="p-2 border rounded-md"
                    >
                      <option value="asc">Naik (Asc)</option>
                      <option value="desc">Turun (Desc)</option>
                    </select>
                  </div>
                </div>

                {/* Tabel */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-100 text-gray-800 text-sm">
                      <tr>
                        <th className="px-4 py-3">Nama</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3 text-center">Jumlah Hadir</th>
                        <th className="px-4 py-3 text-center">Jumlah Tugas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPeserta.map((p) => (
                        <tr key={p._id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3">{p.email}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-md">
                              {p.hadir}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 text-sm bg-purple-100 text-purple-700 rounded-md">
                              {p.tugas}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPeserta.length === 0 && (
                    <p className="text-center text-gray-500 mt-4">
                      Tidak ada peserta ditemukan.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
