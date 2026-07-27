"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/context/AuthContext";
import { SWRConfig } from "swr";
import { apiClient } from "@/lib/api";

// ✅ Toaster dibuat client-only (no SSR) biar tidak bikin hydration mismatch
const Toaster = dynamic(
  () => import("react-hot-toast").then((m) => m.Toaster),
  { ssr: false }
);

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{
        fetcher: (url: string) => apiClient.get(url).then(res => res.data),
        revalidateOnFocus: false, // optional: prevent refetch on window focus for internship project
      }}
    >
      <AuthProvider>
        {children}
        <Toaster position="top-right" reverseOrder={false} />
      </AuthProvider>
    </SWRConfig>
  );
}
