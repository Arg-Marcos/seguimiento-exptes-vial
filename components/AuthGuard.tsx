"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let activo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      if (!data.session) router.replace("/login");
      else setOk(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (!ok) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">Cargando…</div>;
  }

  return <>{children}</>;
}
