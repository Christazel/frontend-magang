"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Pagination } from "@/components/ui/Pagination";
import { userService, feedbackService, getErrorMessage, parsePaginationHeaders } from "@/lib/api";
import type { User, Feedback, PaginationMeta } from "@/types";

export default function FeedbackAdminPage() {
  const [pesertaList, setPesertaList] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  // Pagination for Riwayat Feedback
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [meta, setMeta] = useState<Partial<PaginationMeta>>({});

  const fetchPeserta = async () => {
    try {
      const { data } = await userService.getPesertaList();
      setPesertaList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil peserta:", err);
      toast.error(getErrorMessage(err));
    }
  };

  const fetchAdminFeedback = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await feedbackService.getAdminAllFeedback({ page, limit: rowsPerPage });
      setFeedbackList(Array.isArray(res.data) ? res.data : []);
      setMeta(parsePaginationHeaders(res.headers as Record<string, unknown>));
    } catch (err) {
      console.error("Gagal mengambil riwayat feedback:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [page, rowsPerPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error("Silakan pilih peserta terlebih dahulu.");
      return;
    }
    
    if (!feedback.trim()) {
      toast.error("Pesan feedback tidak boleh kosong.");
      return;
    }

    setLoading(true);
    try {
      await feedbackService.send({ userId: selectedUser, feedback });
      toast.success("Feedback berhasil dikirim ke peserta!");
      setSelectedUser("");
      setFeedback("");
      // Refresh history immediately after sending
      fetchAdminFeedback();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeserta();
  }, []);

  useEffect(() => {
    fetchAdminFeedback();
  }, [fetchAdminFeedback]);

  return (
    <div className="flex min-h-screen bg-gray-50/50 overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />
        
        <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Feedback &amp; Evaluasi
                </h1>
                <p className="text-gray-500 text-sm">
                  Kirimkan evaluasi atau saran langsung ke peserta magang.
                </p>
              </div>
            </div>
          </div>

          <Card className="shadow-sm border-gray-100">
            <CardBody className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Kirim Kepada <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none"
                    required
                  >
                    <option value="" disabled>— Pilih Peserta Magang —</option>
                    {pesertaList.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Pesan Feedback <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-medium leading-relaxed"
                    rows={6}
                    placeholder="Tuliskan feedback yang membangun untuk peserta..."
                    required
                  />
                  <p className="mt-2 text-xs text-gray-500 font-medium">
                    Feedback akan langsung muncul di halaman dashboard peserta yang bersangkutan.
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    isLoading={loading}
                    leftIcon={<PaperAirplaneIcon className="w-5 h-5" />}
                    className="w-full sm:w-auto px-8"
                  >
                    Kirim Feedback
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Riwayat Feedback Section */}
          <h2 className="text-xl font-bold text-gray-900 mt-12 mb-6">Riwayat Keseluruhan Feedback</h2>
          <Card className="shadow-sm border-gray-100">
            <CardBody className="p-6">
              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : feedbackList.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 font-medium">Belum ada feedback yang dikirimkan.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {feedbackList.map((fb) => (
                    <li key={fb._id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 transition-colors duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">Kepada: {fb.user?.name || "User tidak ditemukan"}</span>
                          <span className="text-xs font-medium text-gray-400">
                            {new Date(fb.createdAt).toLocaleString("id-ID", {
                              dateStyle: "long",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        <CheckBadgeIcon className="w-5 h-5 text-blue-400" />
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {fb.feedback}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
            <Pagination 
              page={page}
              totalPages={meta.totalPages || 1}
              totalCount={meta.totalCount || 0}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              itemName="pesan"
            />
          </Card>
          
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
