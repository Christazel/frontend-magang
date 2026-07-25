"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
        <ExclamationTriangleIcon className="w-8 h-8 text-rose-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
        Maaf, kami mengalami masalah teknis saat memuat halaman ini.
      </p>
      <Button onClick={() => reset()} variant="primary">
        Coba Lagi
      </Button>
    </div>
  );
}
