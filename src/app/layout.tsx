import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext"; // pastikan path ini benar
import { Toaster } from "react-hot-toast"; // ✅ Tambahan untuk notifikasi

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Magang",
  description: "Sistem Informasi Manajemen Magang",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
          {/* ✅ Tambahkan komponen Toaster agar notifikasi bisa muncul */}
          <Toaster position="top-right" reverseOrder={false} />
        </AuthProvider>
      </body>
    </html>
  );
}
