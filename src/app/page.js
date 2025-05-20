"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { loading } = useAuth();

  useEffect(() => {
    // Always redirect to feed page
    if (!loading) {
      router.push('/(main)/feed');
    }
  }, [router, loading]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <p className="text-lg text-text-secondary">Redirecting to feed...</p>
      </div>
    </div>
  );
}
