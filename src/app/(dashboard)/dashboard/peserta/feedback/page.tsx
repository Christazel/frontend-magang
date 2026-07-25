"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ChatBubbleLeftRightIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { feedbackService, getErrorMessage } from "@/lib/api";
import type { Feedback } from "@/types";

export default function FeedbackPesertaPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const { data } = await feedbackService.getMyFeedback();
      setFeedbackList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(getErrorMessage(e));
      setFeedbackList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />
        
        <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Feedback & Evaluasi
              </h1>
              <p className="text-sm text-gray-500">Pesan dan masukan dari pembimbing / admin</p>
            </div>
          </div>

          <Card>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-gray-800">Riwayat Pesan</h2>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchFeedback}
                disabled={loading}
              >
                {loading ? "Memuat..." : "Refresh"}
              </Button>
            </div>

            <CardBody className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-blue-600">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm font-semibold">Mengambil data feedback...</p>
                </div>
              ) : feedbackList.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-500">Belum ada feedback</p>
                  <p className="text-xs text-gray-400 mt-1">Evaluasi dari admin akan muncul di sini.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {feedbackList.map((fb) => (
                    <li key={fb._id} className="relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 transition-colors duration-200">
                      {/* Check mark badge top right */}
                      <div className="absolute top-4 right-4">
                        <CheckBadgeIcon className="w-5 h-5 text-blue-400" />
                      </div>

                      <div className="pr-8">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-blue-100">
                            Pesan Admin
                          </span>
                          <p className="text-xs font-medium text-gray-400">
                            {new Date(fb.createdAt).toLocaleString("id-ID", {
                              dateStyle: "long",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                        
                        <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 mt-3">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {fb.feedback}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </main>

        <Footer />
      </div>
    </div>
  );
}
