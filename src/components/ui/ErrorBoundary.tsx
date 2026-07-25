"use client";

import React from "react";
import { Button } from "./Button";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
            Maaf, kami mengalami masalah teknis saat memuat halaman ini. Silakan muat ulang halaman.
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="primary"
          >
            Muat Ulang Halaman
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
