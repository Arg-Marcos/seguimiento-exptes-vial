"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Perfil } from "@/lib/types";

export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!activo) return;
      if (!auth.user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("perfiles")
        .select("id,nombre,rol")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (!activo) return;
      setPerfil((data as Perfil) ?? null);
      setLoading(false);
    })();

    return () => { activo = false; };
  }, []);

  return { perfil, loading };
}
