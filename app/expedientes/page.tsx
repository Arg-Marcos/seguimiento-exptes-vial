"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Edit3, Filter, Plus, Search, Trash2 } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import ExpedienteForm from "@/components/ExpedienteForm";
import { usePerfil } from "@/hooks/usePerfil";
import { supabase } from "@/lib/supabase";
import type { Dependencia, Expediente } from "@/lib/types";

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}
function diasDesde(fecha?: string | null) {
  if (!fecha) return 0;
  return Math.max(0, Math.floor((Date.now()-new Date(fecha).getTime())/86400000));
}
function estadoAlerta(e: Expediente) {
  if (!e.plazo_dias || !e.plazo_definido_en || e.estado !== "en_tramite") return "ok";
  const exceso = diasDesde(e.plazo_definido_en) - e.plazo_dias;
  if (exceso >= 2) return "rojo";
  if (exceso >= 0) return "amarillo";
  return "ok";
}
function resaltar(texto: string, q: string): React.ReactNode {
  const terminos = q.trim().split(/\s+/).filter(Boolean);
  if (terminos.length === 0) return texto;

  const patron = terminos
    .map((termino) => termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const regex = new RegExp(`(${patron})`, "gi");

  return texto.split(regex).map((parte, index) => {
    const coincide = terminos.some(
      (termino) => parte.toLowerCase() === termino.toLowerCase(),
    );

    return coincide ? (
      <mark
        key={`${parte}-${index}`}
        className="rounded bg-sky-100 px-0.5 font-black text-sky-800"
      >
        {parte}
      </mark>
    ) : (
      parte
    );
  });
}

export default function ExpedientesPage() {
  const { perfil } = usePerfil();
  const [items,setItems] = useState<Expediente[]>([]);
  const [deps,setDeps] = useState<Dependencia[]>([]);
  const [buscar,setBuscar] = useState("");
  const [estado,setEstado] = useState("");
  const [prioridad,setPrioridad] = useState("");
  const [anio,setAnio] = useState("");
  const [dep,setDep] = useState("");
  const [modal,setModal] = useState(false);
  const [editando,setEditando] = useState<Expediente|null>(null);
  const [expandido,setExpandido] = useState<string|null>(null);

  async function cargar() {
    const [{data:e},{data:d}] = await Promise.all([
      supabase.from("expedientes").select("*").order("updated_at",{ascending:false}),
      supabase.from("dependencias").select("id,nombre,activo").eq("activo",true).order("nombre")
    ]);
    setItems((e as Expediente[])??[]);
    setDeps((d as Dependencia[])??[]);
  }
  useEffect(()=>{ cargar(); },[]);

  const filtrados = useMemo(()=>items.filter(x=>{
    const texto = normalizar([x.tipo,x.numero,x.anio,x.area_solicitante,x.dependencia_solicitante,x.ubicacion_actual,x.observaciones].filter(Boolean).join(" "));
    const terms = normalizar(buscar).split(/\s+/).filter(Boolean);
    if (terms.some(t=>!texto.includes(t))) return false;
    if (estado && x.estado!==estado) return false;
    if (prioridad && x.prioridad!==prioridad) return false;
    if (anio && String(x.anio)!==anio) return false;
    if (dep && x.dependencia_id!==dep) return false;
    return true;
  }),[items,buscar,estado,prioridad,anio,dep]);

  async function eliminar(e: Expediente) {
    if (!confirm(`¿Archivar ${e.tipo} ${e.numero}/${e.anio}?`)) return;
    await supabase.from("expedientes").update({estado:"archivado"}).eq("id",e.id);
    cargar();
  }

  return <AuthGuard><AppShell>
    <div className="p-4 md:p-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><div className="text-xs font-black uppercase tracking-[.16em] text-sky-600">Seguimiento documental</div><h2 className="text-2xl font-black text-[#0b2b4a]">Expedientes</h2></div>
        <button onClick={()=>{setEditando(null);setModal(true)}} className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-black text-white"><Plus size={17}/> Nuevo expediente</button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#0b2b4a]"><Filter size={17} className="text-sky-600"/> Filtros</div>
        <div className="grid gap-2 lg:grid-cols-[2fr_1fr_1fr_100px_1.3fr_auto]">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search size={16} className="text-slate-400"/><input value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="Número, área, dependencia…" className="w-full bg-transparent text-sm outline-none"/></div>
          <select value={estado} onChange={e=>setEstado(e.target.value)} className="filter"><option value="">Todos los estados</option><option value="en_tramite">En trámite</option><option value="devuelto">Devuelto</option><option value="finalizado">Finalizado</option><option value="archivado">Archivado</option></select>
          <select value={prioridad} onChange={e=>setPrioridad(e.target.value)} className="filter"><option value="">Todas las prioridades</option><option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select>
          <input value={anio} onChange={e=>setAnio(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="Año" className="filter"/>
          <select value={dep} onChange={e=>setDep(e.target.value)} className="filter"><option value="">Todas las dependencias</option>{deps.map(d=><option key={d.id} value={d.id}>{d.nombre}</option>)}</select>
          <button onClick={()=>{setBuscar("");setEstado("");setPrioridad("");setAnio("");setDep("")}} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-600">Limpiar</button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-1120px border-collapse text-left">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500">
              <tr><th className="p-3">Expediente</th><th className="p-3">Dependencia</th><th className="p-3">Área</th><th className="p-3">Ubicación</th><th className="p-3">Prioridad</th><th className="p-3">Estado</th><th className="p-3">Plazo</th><th className="p-3">Actualizado</th><th className="p-3">Acciones</th></tr>
            </thead>
            <tbody>
              {filtrados.map(x=>{
                const alerta = estadoAlerta(x);
                return <tr key={x.id} className={`border-t border-slate-100 text-sm ${alerta==="amarillo"?"alert-yellow":alerta==="rojo"?"alert-red":"hover:bg-sky-50/40"}`}>
                  <td className="p-3"><button onClick={()=>setExpandido(expandido===x.id?null:x.id)} className="flex items-center gap-2 font-black text-[#0b2b4a]"><ChevronDown size={15} className={expandido===x.id?"rotate-180":""}/>{x.tipo} {x.numero}/{x.anio}</button></td>
                  <td className="p-3 font-semibold text-slate-700">{resaltar(x.dependencia_solicitante,buscar)}</td>
                  <td className="p-3 text-slate-600">{x.area_solicitante}</td>
                  <td className="p-3 font-semibold text-slate-700">{x.ubicacion_actual}</td>
                  <td className="p-3"><span className={`rounded-lg px-2 py-1 text-[11px] font-black uppercase ${x.prioridad==="urgente"?"bg-red-100 text-red-700":x.prioridad==="alta"?"bg-orange-100 text-orange-700":x.prioridad==="normal"?"bg-slate-100 text-slate-700":"bg-blue-50 text-blue-700"}`}>{x.prioridad}</span></td>
                  <td className="p-3"><span className="rounded-lg bg-sky-100 px-2 py-1 text-[11px] font-black uppercase text-sky-700">{x.estado.replace("_"," ")}</span></td>
                  <td className="p-3 font-black text-slate-700">{x.plazo_dias ? `${x.plazo_dias} días` : "—"}</td>
                  <td className="p-3 text-xs font-semibold text-slate-500">{new Date(x.fecha_actualizacion_ubicacion).toLocaleString("es-AR")}</td>
                  <td className="p-3"><div className="flex gap-1"><button onClick={()=>{setEditando(x);setModal(true)}} className="rounded-lg border border-slate-200 p-2 text-sky-700"><Edit3 size={15}/></button><button onClick={()=>eliminar(x)} className="rounded-lg border border-slate-200 p-2 text-red-600"><Trash2 size={15}/></button></div></td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {perfil && <ExpedienteForm abierto={modal} onClose={()=>setModal(false)} onSaved={cargar} rol={perfil.rol} expediente={editando} />}

    <style jsx>{`.filter{height:44px;border:1px solid #d8e3ec;border-radius:12px;background:#f8fbfd;padding:0 12px;outline:none;color:#334155}`}</style>
  </AppShell></AuthGuard>
}
