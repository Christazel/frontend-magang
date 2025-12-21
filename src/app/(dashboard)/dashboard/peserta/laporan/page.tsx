"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type LaporanType = {
  _id: string;
  judul: string;
  deskripsi: string;
  createdAt: string;

  // ✅ sesuai backend (GridFS)
  fileId: string;

  // metadata (opsional)
  originalName?: string;
  mimeType?: string;
  gfsFilename?: string;
  size?: number;
};

const MAX_MB = 4;
const MAX_BYTES = MAX_MB * 1024 * 1024;

const fmtTanggal = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });

const bytesToMB = (bytes: number) => bytes / 1024 / 1024;

async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.onload = () => {
      const result = String(reader.result || "");
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 ${spinning ? "animate-spin" : ""}`}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v7h-7" />
    </svg>
  );
}

export default function LaporanPesertaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  const [laporanList, setLaporanList] = useState<LaporanType[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDeskripsi, setEditDeskripsi] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }, []);

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const parseErrorMessage = async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        const j = await res.json();
        return j?.msg || j?.error || `Request gagal (HTTP ${res.status})`;
      }
    } catch {}
    return `Request gagal (HTTP ${res.status})`;
  };

  const getLaporanList = async () => {
    if (!token) return;
    setLoadingList(true);
    try {
      const res = await fetch("/api/laporan", { headers: authHeaders });
      const data = await res.json();

      if (Array.isArray(data)) {
        setLaporanList(data);
      } else if (Array.isArray(data?.data)) {
        setLaporanList(data.data);
      } else {
        setLaporanList([]);
      }
    } catch (e) {
      console.error(e);
      setLaporanList([]);
    } finally {
      setLoadingList(false);
    }
  };

  const uploadMultipart = async () => {
    if (!file) throw new Error("File belum dipilih.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("judul", judul.trim());
    formData.append("deskripsi", deskripsi.trim());

    const res = await fetch("/api/laporan", {
      method: "POST",
      headers: { ...authHeaders },
      body: formData,
    });

    if (!res.ok) throw new Error(await parseErrorMessage(res));
  };

  const uploadBase64 = async () => {
    if (!file) throw new Error("File belum dipilih.");

    const base64 = await readFileAsBase64(file);

    const res = await fetch("/api/laporan/base64", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        filename: file.name,
        base64,
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        mimeType: file.type || "application/octet-stream",
      }),
    });

    if (!res.ok) throw new Error(await parseErrorMessage(res));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert("Token tidak ditemukan. Silakan login ulang.");
    if (!file) return alert("Pilih file dulu.");

    if (file.size > MAX_BYTES) {
      return alert(
        `Ukuran file terlalu besar. Maksimal ${MAX_MB}MB.\nUkuran file kamu: ${bytesToMB(file.size).toFixed(2)}MB`
      );
    }

    setIsUploading(true);
    try {
      try {
        await uploadMultipart();
      } catch (err: any) {
        const SAFE_BASE64_BYTES = 3 * 1024 * 1024;
        if (file.size <= SAFE_BASE64_BYTES) {
          console.warn("Multipart gagal, coba fallback base64...", err?.message);
          await uploadBase64();
        } else {
          throw err;
        }
      }

      alert("Laporan berhasil diupload!");
      setFile(null);
      setJudul("");
      setDeskripsi("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await getLaporanList();
    } catch (err: any) {
      console.error(err);
      alert(`Gagal upload laporan: ${err?.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return alert("Token tidak ditemukan. Silakan login ulang.");

    const ok = confirm("Yakin mau hapus laporan ini?");
    if (!ok) return;

    const res = await fetch(`/api/laporan/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (res.ok) {
      alert("Laporan dihapus");
      getLaporanList();
    } else {
      alert(`Gagal menghapus laporan: ${await parseErrorMessage(res)}`);
    }
  };

  const handleUpdateDeskripsi = async (id: string) => {
    if (!token) return alert("Token tidak ditemukan. Silakan login ulang.");

    const res = await fetch(`/api/laporan/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ deskripsi: editDeskripsi }),
    });

    if (res.ok) {
      alert("Deskripsi berhasil diperbarui");
      setEditingId(null);
      getLaporanList();
    } else {
      alert(`Gagal update deskripsi: ${await parseErrorMessage(res)}`);
    }
  };

  useEffect(() => {
    if (token) getLaporanList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fileSizeMB = file ? bytesToMB(file.size) : 0;
  const fileTooBig = file ? file.size > MAX_BYTES : false;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />

        <main className="p-4 sm:p-6 flex-1">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Laporan Tugas Magang</h1>

          {/* Upload */}
          <div className="bg-white p-4 rounded shadow mb-8">
            <form onSubmit={handleUpload} className="flex flex-col gap-4 md:flex-row md:items-center">
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="border p-2 rounded text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 w-full md:w-auto"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                required
              />

              <input
                type="text"
                placeholder="Judul laporan (opsional, default: nama file)"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                className="border p-2 rounded text-gray-800 placeholder-gray-500 flex-1"
              />

              <input
                type="text"
                placeholder="Deskripsi laporan (opsional)"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="border p-2 rounded text-gray-800 placeholder-gray-500 flex-1"
              />

              <button
                type="submit"
                disabled={isUploading || fileTooBig}
                className={`px-4 py-2 rounded w-full md:w-auto text-white ${
                  isUploading || fileTooBig
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </form>

            {/* ✅ Notice ukuran maksimal */}
            <div
              className={`mt-3 rounded border p-3 text-sm ${
                fileTooBig ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Catatan Upload</p>
                <p>
                  Ukuran file maksimal <b>{MAX_MB}MB</b>. Jika lebih besar, upload akan ditolak oleh server.
                </p>

                {file ? (
                  <p className="mt-1">
                    File dipilih: <b className="break-words">{file.name}</b> —{" "}
                    <b>{fileSizeMB.toFixed(2)}MB</b>{" "}
                    {fileTooBig ? <span className="ml-1">(terlalu besar)</span> : null}
                  </p>
                ) : (
                  <p className="mt-1">Belum ada file dipilih.</p>
                )}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Riwayat Laporan</h2>

              {/* tombol refresh ikon biru */}
              <button
                type="button"
                onClick={getLaporanList}
                disabled={loadingList}
                title="Refresh"
                aria-label="Refresh"
                className={`p-2.5 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  loadingList ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <RefreshIcon spinning={loadingList} />
              </button>
            </div>

            {loadingList ? (
              <p className="text-gray-600">Memuat data...</p>
            ) : laporanList.length === 0 ? (
              <p className="text-gray-600">Belum ada laporan diunggah.</p>
            ) : (
              <ul className="space-y-4 text-gray-800">
                {laporanList.map((lap) => (
                  <li key={lap._id} className="border rounded p-3">
                    <div className="flex flex-col gap-1">
                      <a
                        href={`/api/laporan/download/${lap.fileId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline break-words"
                        title="Download laporan"
                      >
                        {lap.judul}
                      </a>

                      <p className="text-sm text-gray-600">{fmtTanggal(lap.createdAt)}</p>

                      {editingId === lap._id ? (
                        <>
                          <input
                            type="text"
                            value={editDeskripsi}
                            onChange={(e) => setEditDeskripsi(e.target.value)}
                            className="border px-2 py-1 mt-1 rounded w-full text-gray-800"
                          />
                          <div className="mt-2 flex gap-3 text-sm">
                            <button
                              type="button"
                              onClick={() => handleUpdateDeskripsi(lap._id)}
                              className="text-green-600"
                            >
                              Simpan
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className="text-gray-500">
                              Batal
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-700 break-words">
                            {lap.deskripsi?.trim() ? lap.deskripsi : (
                              <span className="text-red-500">Belum ada deskripsi.</span>
                            )}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(lap._id);
                                setEditDeskripsi(lap.deskripsi || "");
                              }}
                              className="text-blue-600"
                            >
                              Edit Deskripsi
                            </button>

                            <button type="button" onClick={() => handleDelete(lap._id)} className="text-red-600">
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
