"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { MesaEntrada } from "@/lib/types";
export default function FiltroMesa({ value, onChange }: { value: string; onChange: (value: string) => void }) {
 const [mesas, setMesas] = useState<MesaEntrada[]>([]);
 useEffect(() => { supabase.from("mesas_entrada").select("id,nombre,activo").order("nombre").then(({ data }) => setMesas(data ?? [])); }, []);
 return <select aria-label="Filtrar por mesa de entrada" value={value} onChange={(e) => onChange(e.target.value)} className="mb-4 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
  <option value="">Todas las mesas de entrada</option>
  {mesas.map((mesa) => <option key={mesa.id} value={mesa.id}>{mesa.nombre}</option>)}
  <option value="sin_asignar">Sin mesa asignada (registros anteriores)</option>
 </select>;
}
