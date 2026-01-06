"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/context/AuthContext";

// ✅ Toaster dibuat client-only (no SSR) biar tidak bikin hydration mismatch
const Toaster = dynamic(
  () => import("react-hot-toast").then((m) => m.Toaster),
  { ssr: false }
);

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" reverseOrder={false} />
    </AuthProvider>
  );
}
