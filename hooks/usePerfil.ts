"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Perfil } from "@/lib/types";

let perfilCache: Perfil | null = null;
let perfilPromise: Promise<Perfil | null> | null = null;
let cacheInicializado = false;

async function obtenerPerfil(): Promise<Perfil | null> {
  if (cacheInicializado) return perfilCache;
  if (perfilPromise) return perfilPromise;

  perfilPromise = (async () => {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      perfilCache = null;
      cacheInicializado = true;
      return null;
    }

    const { data, error } = await supabase
      .from("perfiles")
      .select("id,nombre,rol")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (error) throw error;

    perfilCache = (data as Perfil) ?? null;
    cacheInicializado = true;
    return perfilCache;
  })().finally(() => {
    perfilPromise = null;
  });

  return perfilPromise;
}

export function limpiarPerfilCache() {
  perfilCache = null;
  perfilPromise = null;
  cacheInicializado = false;
}

export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(perfilCache);
  const [loading, setLoading] = useState(!cacheInicializado);

  useEffect(() => {
    let activo = true;

    if (!cacheInicializado) {
      obtenerPerfil()
        .then((resultado) => {
          if (!activo) return;
          setPerfil(resultado);
          setLoading(false);
        })
        .catch(() => {
          if (!activo) return;
          setPerfil(null);
          setLoading(false);
        });
    } else {
      setPerfil(perfilCache);
      setLoading(false);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        limpiarPerfilCache();
        if (activo) {
          setPerfil(null);
          setLoading(false);
        }
      }
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { perfil, loading };
}
