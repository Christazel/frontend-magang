"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import {
  ClockIcon,
  ArrowPathIcon,
  MapPinIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { presensiService, userService, getErrorMessage, parsePaginationHeaders } from "@/lib/api";
import { exportPresensiToExcel, type PresensiExportRow } from "@/lib/exportExcel";
import type { Presensi } from "@/types";
import toast from "react-hot-toast";

const ROWS_PER_PAGE = 10;

type Grouped = {
  user?: { _id?: string; name: string; email: string };
  presensi: Presensi[];
};

function groupByUser(data: Presensi[]): Grouped[] {
  const acc: Record<string, Grouped> = {};
  for (const item of data) {
    const key = item.user?.email || "unknown";
    if (!acc[key]) acc[key] = { user: item.user as { _id?: string; name: string; email: string }, presensi: [] };
    acc[key].presensi.push(item);
  }
  return Object.values(acc);
}

export default function RekapPresensiPage() {
  const [data, setData] = useState<Presensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // State Modal Input/Edit Manual
  const [showModal, setShowModal] = useState(false);
  const [pesertaOptions, setPesertaOptions] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [formUserId, setFormUserId] = useState("");
  const [formTanggal, setFormTanggal] = useState("");
  const [formJamMasuk, setFormJamMasuk] = useState("");
  const [formJamKeluar, setFormJamKeluar] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchPresensiAdmin = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await presensiService.getAdminAll({
        page,
        limit: ROWS_PER_PAGE,
        search: debouncedSearch || undefined,
      });

      const meta = parsePaginationHeaders(response.headers);
      setTotalCount(meta.totalCount || 0);
      setTotalPages(meta.totalPages || 1);
      setData(Array.isArray(response.data) ? response.data : []);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchPresensiAdmin();
  }, [fetchPresensiAdmin]);

  // Fetch daftar peserta untuk dropdown modal
  useEffect(() => {
    userService
      .getPesertaList()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setPesertaOptions(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const openCreateModal = () => {
    setFormUserId(pesertaOptions[0]?._id || "");
    const today = new Date().toISOString().split("T")[0];
    setFormTanggal(today);
    setFormJamMasuk("08:00:00");
    setFormJamKeluar("16:00:00");
    setShowModal(true);
  };

  const openEditModal = (item: Presensi, userIdFallback?: string) => {
    const userId = (typeof item.user === "object" && item.user ? (item.user as { _id?: string })._id : "") || userIdFallback || "";
    setFormUserId(userId);
    setFormTanggal(item.tanggal || "");
    setFormJamMasuk(item.jamMasuk || "");
    setFormJamKeluar(item.jamKeluar || "");
    setShowModal(true);
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserId || !formTanggal) {
      toast.error("Peserta dan Tanggal wajib diisi!");
      return;
    }

    setSaving(true);
    try {
      await presensiService.inputManual({
        userId: formUserId,
        tanggal: formTanggal,
        jamMasuk: formJamMasuk || undefined,
        jamKeluar: formJamKeluar || undefined,
      });
      toast.success("Presensi manual berhasil disimpan! ✅");
      setShowModal(false);
      fetchPresensiAdmin();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePresensi = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data presensi ini?")) return;
    setDeletingId(id);
    try {
      await presensiService.deletePresensi(id);
      toast.success("Data presensi berhasil dihapus! 🗑️");
      fetchPresensiAdmin();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = groupByUser(data);

  // Export semua data yang sedang tampil ke Excel (CSV)
  const handleExportExcel = () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }
    const rows: PresensiExportRow[] = data.map((p) => ({
      nama: (p.user as { name?: string } | undefined)?.name || "-",
      email: (p.user as { email?: string } | undefined)?.email || "-",
      tanggal: p.tanggal
        ? new Date(p.tanggal).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "-",
      jamMasuk: p.jamMasuk || "-",
      lokasiMasuk: p.lokasiMasuk || "-",
      jamKeluar: p.jamKeluar || "-",
      lokasiKeluar: p.lokasiKeluar || "-",
    }));
    exportPresensiToExcel(rows);
    toast.success(`${rows.length} data berhasil diekspor ke Excel.`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50 overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
          <div className="space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <ClockIcon className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Rekap Presensi Peserta
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Pantau & kelola riwayat presensi harian seluruh peserta magang
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <button
                  onClick={handleExportExcel}
                  disabled={loading || data.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Export Excel
                </button>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Input Presensi Manual
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl shadow-sm text-sm font-medium flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Main Content Area */}
            <Card>
              <CardBody className="p-5">
                
                {/* Search Bar */}
                <div className="mb-6 flex gap-3">
                  <div className="flex-1">
                    <Input
                      label="Pencarian"
                      placeholder="Cari nama atau email peserta..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="self-end pb-1 hidden sm:block">
                    {search && (
                      <Button variant="secondary" onClick={() => setSearch("")}>Reset</Button>
                    )}
                  </div>
                </div>

                {/* Loading State */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-blue-600">
                    <ArrowPathIcon className="w-8 h-8 animate-spin mb-3" />
                    <p className="text-sm font-semibold">Memuat riwayat presensi...</p>
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 m-6">
                    <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-500">Tidak ada data presensi ditemukan</p>
                    <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {grouped.map((group) => (
                      <div key={group.user?.email || "unknown"} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                        
                        {/* Header Group */}
                        <div className="bg-gray-50/80 border-b border-gray-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h2 className="text-base font-bold text-gray-900">{group.user?.name || "Tanpa Nama"}</h2>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">{group.user?.email}</p>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 self-start sm:self-auto">
                            {group.presensi.length} Data Ditampilkan
                          </span>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden p-4 space-y-3">
                          {group.presensi.map((p) => (
                            <div key={p._id} className="rounded-xl border border-gray-100 p-4 bg-gray-50/30 space-y-3">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <span className="text-sm font-bold text-gray-800">
                                  {p.tanggal ? new Date(p.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditModal(p, group.user?._id)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Presensi"
                                  >
                                    <PencilSquareIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePresensi(p._id)}
                                    disabled={deletingId === p._id}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Hapus Presensi"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Masuk</p>
                                  <p className="font-bold text-gray-900 font-mono">{p.jamMasuk || "-"}</p>
                                  {p.lokasiMasuk && (
                                    <a href={`https://www.google.com/maps?q=${p.lokasiMasuk}`} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 hover:underline">
                                      <MapPinIcon className="w-3 h-3" /> {p.lokasiMasuk}
                                    </a>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Keluar</p>
                                  <p className="font-bold text-gray-900 font-mono">{p.jamKeluar || "-"}</p>
                                  {p.lokasiKeluar && (
                                    <a href={`https://www.google.com/maps?q=${p.lokasiKeluar}`} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 hover:underline">
                                      <MapPinIcon className="w-3 h-3" /> {p.lokasiKeluar}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="min-w-full text-sm text-left text-gray-700">
                            <thead className="bg-gray-50/50">
                              <tr>
                                <th className="px-5 py-3 font-semibold text-gray-800 border-b border-gray-100">Tanggal</th>
                                <th className="px-5 py-3 font-semibold text-gray-800 border-b border-gray-100">Presensi Masuk</th>
                                <th className="px-5 py-3 font-semibold text-gray-800 border-b border-gray-100">Presensi Keluar</th>
                                <th className="px-5 py-3 font-semibold text-gray-800 border-b border-gray-100 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {group.presensi.map((p) => (
                                <tr key={p._id} className="hover:bg-blue-50/30 transition-colors">
                                  <td className="px-5 py-4 font-medium text-gray-900">
                                    {p.tanggal ? new Date(p.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                  </td>
                                  <td className="px-5 py-4">
                                    <p className="font-bold font-mono text-emerald-700 text-lg leading-none mb-1">{p.jamMasuk || "-"}</p>
                                    {p.lokasiMasuk && (
                                      <a href={`https://www.google.com/maps?q=${p.lokasiMasuk}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-2 py-0.5 rounded-full">
                                        <MapPinIcon className="w-3 h-3" /> {p.lokasiMasuk}
                                      </a>
                                    )}
                                  </td>
                                  <td className="px-5 py-4">
                                    <p className="font-bold font-mono text-rose-700 text-lg leading-none mb-1">{p.jamKeluar || "-"}</p>
                                    {p.lokasiKeluar && (
                                      <a href={`https://www.google.com/maps?q=${p.lokasiKeluar}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-2 py-0.5 rounded-full">
                                        <MapPinIcon className="w-3 h-3" /> {p.lokasiKeluar}
                                      </a>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    <div className="inline-flex items-center gap-2">
                                      <button
                                        onClick={() => openEditModal(p, group.user?._id)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Presensi"
                                      >
                                        <PencilSquareIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeletePresensi(p._id)}
                                        disabled={deletingId === p._id}
                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Hapus Presensi"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  rowsPerPage={ROWS_PER_PAGE}
                  onPageChange={setPage}
                  itemName="presensi"
                />
              </div>
            )}
            
          </div>
        </main>

        <Footer />
      </div>

      {/* Modal Input / Edit Presensi Manual */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Input Presensi Manual</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Peserta</label>
                <select
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="" disabled>Pilih Peserta...</option>
                  {pesertaOptions.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Jam Masuk</label>
                  <input
                    type="time"
                    step="1"
                    value={formJamMasuk}
                    onChange={(e) => setFormJamMasuk(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Jam Keluar</label>
                  <input
                    type="time"
                    step="1"
                    value={formJamKeluar}
                    onChange={(e) => setFormJamKeluar(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {saving ? "Simpan..." : "Simpan Presensi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
