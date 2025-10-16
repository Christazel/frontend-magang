"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type FeedbackType = {
  _id: string;
  feedback: string;
  createdAt: string;
};

export default function FeedbackPesertaPage() {
  const [feedbackList, setFeedbackList] = useState<FeedbackType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/feedback", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setFeedbackList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />
        <main className="p-4 sm:p-6 flex-1">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Feedback dari Admin</h1>
          <div className="bg-white p-4 rounded shadow">
            {loading ? (
              <p className="text-gray-600">Memuat feedback...</p>
            ) : feedbackList.length === 0 ? (
              <p className="text-gray-600">Belum ada feedback.</p>
            ) : (
              <ul className="space-y-4 text-gray-800">
                {feedbackList.map((fb) => (
                  <li key={fb._id} className="border-b pb-2">
                    <p>{fb.feedback}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(fb.createdAt).toLocaleString("id-ID", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}
                    </p>
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
