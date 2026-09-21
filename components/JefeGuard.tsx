"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { usePerfil } from "@/hooks/usePerfil";

export default function JefeGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { perfil, loading } = usePerfil();

  useEffect(() => {
    if (!loading && perfil && perfil.rol !== "jefe") {
      router.replace("/expedientes");
    }
  }, [loading, perfil, router]);

  return (
    <AuthGuard>
      {loading || !perfil || perfil.rol !== "jefe" ? (
        <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">
          Cargando…
        </div>
      ) : (
        children
      )}
    </AuthGuard>
  );
}
