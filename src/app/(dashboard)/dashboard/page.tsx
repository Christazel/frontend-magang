"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardRedirectPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    if (user.role === "admin") {
      router.replace("/dashboard/admin");
    } else if (user.role === "peserta") {
      router.replace("/dashboard/peserta");
    } else {
      router.replace("/login");
    }
  }, [user, router]);

  return null;
}
