import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SIPMA - Sistem Informasi Pengelolaan Magang | Dinas Pendidikan dan Kebudayaan Kabupaten Melawi",
    template: "%s | SIPMA Dinas Pendidikan Kabupaten Melawi",
  },
  description: "Sistem Informasi Pengelolaan Magang Resmi Dinas Pendidikan dan Kebudayaan Kabupaten Melawi",
  icons: {
    icon: [
      { url: "/images/Logo-dikbud.png", type: "image/png" },
    ],
    shortcut: "/images/Logo-dikbud.png",
    apple: "/images/Logo-dikbud.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
