"use client";

import { useEffect, useState } from "react";
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

const getBaseUrl = () => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5000";
  } else {
    return "http://192.168.1.5:5000";
  }
};

export default function LaporanAdminPage() {
  const [laporanList, setLaporanList] = useState<LaporanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");

  const getLaporanList = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const res = await fetch(`${getBaseUrl()}/api/laporan/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Gagal mengambil data laporan");
      const data = await res.json();
      setLaporanList(data);
    } catch (err) {
      console.error("❌ Gagal memuat laporan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLaporanList();
  }, []);

  const filteredList = laporanList.filter((lap) => {
    const keywordMatch =
      lap.user.name.toLowerCase().includes(search.toLowerCase()) ||
      lap.judul.toLowerCase().includes(search.toLowerCase());

    const tanggalMatch = filterTanggal
      ? new Date(lap.createdAt).toLocaleDateString("sv-SE") === filterTanggal
      : true;

    return keywordMatch && tanggalMatch;
  });

  // Kelompokkan dan urutkan laporan per user (berdasarkan nama)
  const laporanPerUser: { [email: string]: LaporanType[] } = {};
  filteredList.forEach((lap) => {
    if (!laporanPerUser[lap.user.email]) {
      laporanPerUser[lap.user.email] = [];
    }
    laporanPerUser[lap.user.email].push(lap);
  });

  const sortedEmails = Object.keys(laporanPerUser).sort((a, b) =>
    laporanPerUser[a][0].user.name.localeCompare(laporanPerUser[b][0].user.name)
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col pt-16">
        <Navbar />
        <main className="p-4 sm:p-6 flex-1">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Daftar Laporan Mahasiswa</h1>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Cari nama peserta / judul file..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-1/2 p-2 border border-gray-300 rounded focus:ring-blue-400 text-gray-900 placeholder-gray-500"
            />
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              className="w-full sm:w-1/3 p-2 border border-gray-300 rounded focus:ring-blue-400 text-gray-900 placeholder-gray-500"
            />
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            {loading ? (
              <p className="text-gray-800">Memuat data...</p>
            ) : sortedEmails.length === 0 ? (
              <p className="text-gray-800">Tidak ada laporan yang cocok.</p>
            ) : (
              <>
                {sortedEmails.map((email) => {
                  const laporans = laporanPerUser[email];
                  return (
                    <div key={email} className="mb-8">
                      <h2 className="text-lg font-semibold text-blue-700 mb-2">
                        {laporans[0].user.name} ({email})
                      </h2>

                      {/* Mobile View */}
                      <div className="block md:hidden space-y-4">
                        {laporans.map((lap) => (
                          <div
                            key={lap._id}
                            className="border border-gray-300 rounded p-4 text-sm text-gray-800 shadow-sm"
                          >
                            <p><span className="font-semibold">Judul:</span> {lap.judul}</p>
                            <p><span className="font-semibold">Deskripsi:</span> {lap.deskripsi || "-"}</p>
                            <p>
                              <span className="font-semibold">Tanggal:</span>{" "}
                              {new Date(lap.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            <a
                              href={`${getBaseUrl()}/api/laporan/download/${lap.file}`}
                              className="text-blue-600 hover:underline font-medium mt-2 inline-block"
                              target="_blank"
                            >
                              Download
                            </a>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View */}
                      <div className="hidden md:block overflow-x-auto mt-2">
                        <table className="w-full table-fixed text-sm text-left border text-gray-800">
                          <thead className="bg-gray-100 text-gray-900 font-semibold">
                            <tr>
                              <th className="p-3 w-1/3 whitespace-nowrap">Judul File</th>
                              <th className="p-3 w-1/3 whitespace-nowrap">Deskripsi</th>
                              <th className="p-3 w-1/4 whitespace-nowrap">Tanggal Upload</th>
                              <th className="p-3 w-1/6 whitespace-nowrap">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {laporans.map((lap) => (
                              <tr key={lap._id} className="border-t hover:bg-gray-50">
                                <td className="p-3 whitespace-nowrap">{lap.judul}</td>
                                <td className="p-3 whitespace-nowrap">{lap.deskripsi || "-"}</td>
                                <td className="p-3 whitespace-nowrap">
                                  {new Date(lap.createdAt).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <a
                                    href={`${getBaseUrl()}/api/laporan/download/${lap.file}`}
                                    className="text-blue-600 hover:underline font-medium"
                                    target="_blank"
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
                  );
                })}
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
