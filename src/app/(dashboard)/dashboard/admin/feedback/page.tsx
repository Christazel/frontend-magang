"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type User = {
  _id: string;
  name: string;
  email: string;
};

export default function FeedbackAdminPage() {
  const [pesertaList, setPesertaList] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchPeserta = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/users/peserta", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setPesertaList(data);
    } catch (err) {
      console.error("Gagal mengambil peserta:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUser, feedback }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.msg || "Gagal mengirim feedback");

      setMessage("✅ Feedback berhasil dikirim");
      setSelectedUser("");
      setFeedback("");
    } catch (error: any) {
      setMessage("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeserta();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />
        <main className="p-4 sm:p-6 flex-1">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Kirim Feedback ke Peserta</h1>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-4 sm:p-6 rounded shadow max-w-xl w-full"
          >
            {message && (
              <div
                className={`mb-4 p-3 rounded text-sm ${
                  message.startsWith("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <div className="mb-4">
              <label className="block font-medium mb-1 text-gray-700">Pilih Peserta</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-gray-800"
                required
              >
                <option value="">— Pilih Peserta —</option>
                {pesertaList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-1 text-gray-700">Pesan Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-gray-800"
                rows={4}
                placeholder="Tulis feedback untuk peserta..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Mengirim..." : "Kirim Feedback"}
            </button>
          </form>
        </main>
        <Footer />
      </div>
    </div>
  );
}
