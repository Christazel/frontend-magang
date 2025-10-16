"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type LaporanType = {
  _id: string;
  judul: string;
  file: string;
  deskripsi: string;
  createdAt: string;
};

export default function LaporanPesertaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [deskripsi, setDeskripsi] = useState("");
  const [laporanList, setLaporanList] = useState<LaporanType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDeskripsi, setEditDeskripsi] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("deskripsi", deskripsi);

    const res = await fetch("/api/laporan", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.ok) {
      alert("Laporan berhasil diupload!");
      getLaporanList();
      setFile(null);
      setDeskripsi("");
    } else {
      alert("Gagal upload laporan");
    }
  };

  const getLaporanList = async () => {
    const res = await fetch("/api/laporan", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setLaporanList(data);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/laporan/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      alert("Laporan dihapus");
      getLaporanList();
    } else {
      alert("Gagal menghapus laporan");
    }
  };

  const handleUpdateDeskripsi = async (id: string) => {
    const res = await fetch(`/api/laporan/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ deskripsi: editDeskripsi }),
    });

    if (res.ok) {
      alert("Deskripsi berhasil diperbarui");
      setEditingId(null);
      getLaporanList();
    } else {
      alert("Gagal update deskripsi");
    }
  };

  useEffect(() => {
    if (token) {
      getLaporanList();
    }
  }, [token]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />
        <main className="p-4 sm:p-6 flex-1">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Upload Laporan Magang</h1>

          <form
            onSubmit={handleUpload}
            className="bg-white p-4 rounded shadow mb-8 flex flex-col gap-4 md:flex-row md:items-center"
          >
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="border p-2 rounded text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 w-full md:w-auto"
              accept=".pdf,.docx,.xlsx"
              required
            />
            <input
              type="text"
              placeholder="Deskripsi laporan..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="border p-2 rounded text-gray-800 placeholder-gray-500 flex-1"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto"
            >
              Upload
            </button>
          </form>

          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Riwayat Laporan</h2>
            {laporanList.length === 0 ? (
              <p className="text-gray-600">Belum ada laporan diunggah.</p>
            ) : (
              <ul className="space-y-4 text-gray-800">
                {laporanList.map((lap) => (
                  <li key={lap._id}>
                    <div>
                      <a
                        href={`/api/laporan/download/${lap.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {lap.judul}
                      </a>
                      <p className="text-sm text-gray-600">
                        {new Date(lap.createdAt).toLocaleString("id-ID", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}
                      </p>
                      {editingId === lap._id ? (
                        <>
                          <input
                            type="text"
                            value={editDeskripsi}
                            onChange={(e) => setEditDeskripsi(e.target.value)}
                            className="border px-2 py-1 mt-1 rounded w-full text-gray-800"
                          />
                          <div className="mt-1 flex gap-2">
                            <button
                              onClick={() => handleUpdateDeskripsi(lap._id)}
                              className="text-green-600"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-500"
                            >
                              Batal
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-700">
                            {lap.deskripsi || <span className="text-red-500">Belum ada deskripsi.</span>}
                          </p>
                          <div className="flex gap-4 text-sm mt-1">
                            <button
                              onClick={() => {
                                setEditingId(lap._id);
                                setEditDeskripsi(lap.deskripsi || "");
                              }}
                              className="text-blue-600"
                            >
                              Edit Deskripsi
                            </button>
                            <button
                              onClick={() => handleDelete(lap._id)}
                              className="text-red-600"
                            >
                              Hapus
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
