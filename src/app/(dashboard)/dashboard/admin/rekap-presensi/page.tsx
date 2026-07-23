"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { ClockIcon, ArrowPathIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { presensiService, getErrorMessage, parsePaginationHeaders } from "@/lib/api";
import type { Presensi } from "@/types";

const ROWS_PER_PAGE = 10;

type Grouped = {
  user?: { name: string; email: string };
  presensi: Presensi[];
};

// Group flat array by user email
function groupByUser(data: Presensi[]): Grouped[] {
  const acc: Record<string, Grouped> = {};
  for (const item of data) {
    const key = item.user?.email || "unknown";
    if (!acc[key]) acc[key] = { user: item.user, presensi: [] };
    acc[key].presensi.push(item);
  }
  return Object.values(acc);
}

export default function RekapPresensiPage() {
  const [data, setData] = useState<Presensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Server-side search & pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Pagination metadata from headers
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debounceRef = useRef<number | null>(null);

  // Debounce search input → reset ke page 1 tiap search baru
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
    } catch (e: any) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchPresensiAdmin();
  }, [fetchPresensiAdmin]);

  const grouped = groupByUser(data);

  return (
    <div className="flex min-h-screen bg-gray-50/50 overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 mt-14 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
          <div className="space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-100 rounded-xl">
                  <ClockIcon className="w-6 h-6 text-teal-700" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Rekap Presensi Peserta
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Pantau riwayat presensi harian seluruh peserta magang
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  Total: {totalCount} Riwayat
                </span>
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
                  <div className="flex flex-col items-center justify-center py-16 text-teal-600">
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
                            <div key={p._id} className="rounded-xl border border-gray-100 p-4 bg-gray-50/30">
                              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                <span className="text-sm font-bold text-gray-800">
                                  {p.tanggal ? new Date(p.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Masuk</p>
                                  <p className="font-bold text-gray-900 font-mono">{p.jamMasuk || "-"}</p>
                                  {p.lokasiMasuk && (
                                    <a href={`https://www.google.com/maps?q=${p.lokasiMasuk}`} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-700 hover:underline">
                                      <MapPinIcon className="w-3 h-3" /> Buka Peta
                                    </a>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Keluar</p>
                                  <p className="font-bold text-gray-900 font-mono">{p.jamKeluar || "-"}</p>
                                  {p.lokasiKeluar && (
                                    <a href={`https://www.google.com/maps?q=${p.lokasiKeluar}`} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-700 hover:underline">
                                      <MapPinIcon className="w-3 h-3" /> Buka Peta
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
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {group.presensi.map((p) => (
                                <tr key={p._id} className="hover:bg-teal-50/30 transition-colors">
                                  <td className="px-5 py-4 font-medium text-gray-900">
                                    {p.tanggal ? new Date(p.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                  </td>
                                  <td className="px-5 py-4">
                                    <p className="font-bold font-mono text-emerald-700 text-lg leading-none mb-1">{p.jamMasuk || "-"}</p>
                                    {p.lokasiMasuk && (
                                      <a href={`https://www.google.com/maps?q=${p.lokasiMasuk}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 hover:text-teal-700 hover:underline bg-teal-50 px-2 py-0.5 rounded-full">
                                        <MapPinIcon className="w-3 h-3" /> Koordinat Lokasi
                                      </a>
                                    )}
                                  </td>
                                  <td className="px-5 py-4">
                                    <p className="font-bold font-mono text-rose-700 text-lg leading-none mb-1">{p.jamKeluar || "-"}</p>
                                    {p.lokasiKeluar && (
                                      <a href={`https://www.google.com/maps?q=${p.lokasiKeluar}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 hover:text-teal-700 hover:underline bg-teal-50 px-2 py-0.5 rounded-full">
                                        <MapPinIcon className="w-3 h-3" /> Koordinat Lokasi
                                      </a>
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
    </div>
  );
}
