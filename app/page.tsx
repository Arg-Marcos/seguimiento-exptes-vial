"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, FileText, Plus } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import ExpedienteForm from "@/components/ExpedienteForm";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/hooks/usePerfil";
import type { Expediente } from "@/lib/types";

function diasDesde(fecha?: string | null) {
  if (!fecha) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000));
}

function alertaPlazo(e: Expediente) {
  if (!e.plazo_dias || !e.plazo_definido_en || e.estado !== "en_tramite") return { nivel: "ok" as const, exceso: 0 };
  const transcurridos = diasDesde(e.plazo_definido_en);
  const exceso = transcurridos - e.plazo_dias;
  if (exceso >= 2) return { nivel: "rojo" as const, exceso };
  if (exceso >= 0) return { nivel: "amarillo" as const, exceso };
  return { nivel: "ok" as const, exceso };
}

export default function Dashboard() {
  const { perfil } = usePerfil();
  const [items, setItems] = useState<Expediente[]>([]);
  const [modal, setModal] = useState(false);

  async function cargar() {
    const { data } = await supabase.from("expedientes").select("*").neq("estado","archivado").order("updated_at",{ascending:false}).limit(80);
    setItems((data as Expediente[]) ?? []);
  }

  useEffect(()=>{ cargar(); },[]);

  const kpis = useMemo(() => {
    const enTramite = items.filter(x=>x.estado==="en_tramite").length;
    const vencidos = items.filter(x=>alertaPlazo(x).nivel==="rojo").length;
    const proximos = items.filter(x=>alertaPlazo(x).nivel==="amarillo").length;
    const finalizados = items.filter(x=>x.estado==="finalizado").length;
    return {enTramite, vencidos, proximos, finalizados};
  },[items]);

  return (
    <AuthGuard>
      <AppShell>
        <div className="p-4 md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-500">Panel general</div>
              <h2 className="text-2xl font-black text-[#0b2b4a]">Seguimiento de expedientes</h2>
            </div>
            <button onClick={()=>setModal(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-black text-white shadow-lg shadow-sky-200 hover:bg-sky-600">
              <Plus size={17}/> Nuevo expediente
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Kpi icon={<FileText/>} label="En trámite" value={kpis.enTramite} tone="blue" />
            <Kpi icon={<Clock3/>} label="Próximos a vencer" value={kpis.proximos} tone="yellow" />
            <Kpi icon={<AlertTriangle/>} label="Vencidos" value={kpis.vencidos} tone="red" />
            <Kpi icon={<CheckCircle2/>} label="Finalizados" value={kpis.finalizados} tone="green" />
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-sky-600">Últimos movimientos</div>
                <div className="text-lg font-black text-[#0b2b4a]">Expedientes recientes</div>
              </div>
              <a href="/expedientes" className="text-sm font-black text-sky-600 hover:text-sky-700">Ver todos →</a>
            </div>
            <div className="space-y-2">
              {items.slice(0,8).map(e=>{
                const alerta = alertaPlazo(e);
                return (
                  <div key={e.id} className={`grid gap-2 rounded-xl border border-slate-200 px-3 py-3 md:grid-cols-[120px_1fr_180px_120px] ${alerta.nivel==="amarillo"?"alert-yellow":alerta.nivel==="rojo"?"alert-red":"bg-white"}`}>
                    <div className="font-mono text-sm font-black text-[#0b2b4a]">{e.numero}/{e.anio}</div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-800">{e.dependencia_solicitante}</div>
                      <div className="truncate text-xs font-semibold text-slate-500">{e.ubicacion_actual}</div>
                    </div>
                    <div className="text-xs font-bold text-slate-600">{e.prioridad.toUpperCase()}</div>
                    <div className="text-right text-xs font-black text-slate-600">
                      {e.plazo_dias ? `${e.plazo_dias} días` : "Sin plazo"}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {perfil && <ExpedienteForm abierto={modal} onClose={()=>setModal(false)} onSaved={cargar} rol={perfil.rol} />}
      </AppShell>
    </AuthGuard>
  );
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label:string; value:number; tone:"blue"|"yellow"|"red"|"green" }) {
  const map = {
    blue:"bg-sky-50 text-sky-700 border-sky-100",
    yellow:"bg-amber-50 text-amber-700 border-amber-100",
    red:"bg-red-50 text-red-700 border-red-100",
    green:"bg-emerald-50 text-emerald-700 border-emerald-100"
  } as const;
  return <div className={`rounded-2xl border p-4 ${map[tone]}`}><div className="flex items-center justify-between"><div className="rounded-xl bg-white/80 p-2 shadow-sm">{icon}</div><div className="text-3xl font-black">{value}</div></div><div className="mt-3 text-sm font-black">{label}</div></div>
}
