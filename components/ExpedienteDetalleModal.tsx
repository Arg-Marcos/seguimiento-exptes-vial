"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, Clock3, Flag, MapPin, Pencil, Route, X } from "lucide-react";
import { estadoAlerta, fechaCorta, textoSeguimiento } from "@/lib/expedientes";
import { esAutoridad } from "@/lib/permisos";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/hooks/usePerfil";
import type { Expediente, MesaEntrada } from "@/lib/types";

type Props = {
  expediente: Expediente | null;
  onClose: () => void;
  onEdit?: (expediente: Expediente) => void;
  onMove?: (expediente: Expediente) => void;
  onSaved?: () => void;
};

export default function ExpedienteDetalleModal({ expediente, onClose, onEdit, onMove, onSaved }: Props) {
  const { perfil } = usePerfil();
  const autoridad = esAutoridad(perfil?.rol);
  const [registro, setRegistro] = useState(expediente);
  const [mesas, setMesas] = useState<MesaEntrada[]>([]);
  const [accion, setAccion] = useState<"plazo" | "prioridad" | null>(null);
  const [plazo, setPlazo] = useState("");
  const [prioridad, setPrioridad] = useState<Expediente["prioridad"]>("normal");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    setRegistro(expediente);
    setAccion(null);
    setError("");
    setMensaje("");
    setPlazo(expediente?.plazo_dias ? String(expediente.plazo_dias) : "");
    setPrioridad(expediente?.prioridad ?? "normal");
  }, [expediente]);

  useEffect(() => {
    if (!expediente) return;
    supabase.from("mesas_entrada").select("id,nombre,activo").then(({ data }) => setMesas(data ?? []));
  }, [expediente?.id]);

  useEffect(() => {
    if (!expediente) return;
    const cerrar = (event: KeyboardEvent) => { if (event.key === "Escape" && !guardando) onClose(); };
    document.addEventListener("keydown", cerrar);
    return () => document.removeEventListener("keydown", cerrar);
  }, [expediente, guardando, onClose]);

  if (!expediente || !registro) return null;
  const alerta = estadoAlerta(registro);
  const mesa = mesas.find((m) => m.id === registro.mesa_id)?.nombre ?? "Sin mesa asignada";

  function abrirAccion(tipo: "plazo" | "prioridad") {
    setAccion(tipo); setError(""); setMensaje("");
    setPlazo(registro?.plazo_dias ? String(registro.plazo_dias) : "");
    setPrioridad(registro?.prioridad ?? "normal");
  }

  async function guardar() {
    if (!registro || !autoridad || !accion || guardando) return;
    const dias = plazo.trim() ? Number(plazo) : null;
    if (accion === "plazo" && dias !== null && (!Number.isInteger(dias) || dias < 1 || dias > 3650)) {
      setError("Ingresá un plazo de 1 a 3650 días, o dejá el campo vacío para quitarlo."); return;
    }
    setGuardando(true); setError(""); setMensaje("");
    try {
      const cambios = accion === "plazo"
        ? { plazo_dias: dias, plazo_definido_en: dias ? new Date().toISOString() : null }
        : { prioridad };
      const { data, error: fallo } = await supabase.from("expedientes").update(cambios).eq("id", registro.id).select("*").single();
      if (fallo) throw fallo;
      setRegistro(data as Expediente);
      setAccion(null);
      setMensaje(accion === "plazo" ? "Plazo actualizado." : "Prioridad actualizada.");
      onSaved?.();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : (fallo as { message?: string })?.message ?? "No se pudo guardar el cambio.");
    } finally { setGuardando(false); }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onClick={() => !guardando && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="detalle-titulo" className="modal-panel w-full max-w-4xl rounded-3xl bg-slate-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-scroll">
        <header className="relative bg-[#0b2b4a] px-6 py-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-sky-300">Ficha del expediente</p>
              <p className="mt-2 break-words text-lg font-semibold text-sky-100">{registro.tipo} · {registro.numero}/{registro.anio}</p>
              <h2 id="detalle-titulo" className="mt-2 break-words text-2xl font-bold leading-tight">{registro.caratula || "Sin carátula"}</h2>
            </div>
            <button aria-label="Cerrar detalle" type="button" disabled={guardando} onClick={onClose} className="rounded-xl bg-white/10 p-2 hover:bg-white/20 disabled:opacity-50"><X size={20}/></button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase">
            <span className="rounded-lg bg-white/10 px-3 py-1.5">{registro.estado.replaceAll("_", " ")}</span>
            <span className={`rounded-lg px-3 py-1.5 ${registro.prioridad === "urgente" ? "bg-red-500 text-white" : "bg-sky-100 text-sky-900"}`}>Prioridad {registro.prioridad}</span>
            {alerta.nivel !== "ok" && <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-amber-900"><AlertTriangle size={14}/> Plazo alcanzado o excedido</span>}
          </div>
        </header>
        <div className="space-y-4 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Grupo titulo="Registro y recorrido">
              <Dato label="Mesa que registra" value={mesa}/>
              <Dato label="Área procedente" value={registro.area_solicitante || "—"}/>
              <Dato label="Área destino" value={registro.dependencia_solicitante || "Sin destino definido"}/>
              <Dato icon={<MapPin size={15}/>} label="Ubicación actual" value={registro.ubicacion_actual}/>
            </Grupo>
            <Grupo titulo="Fechas y seguimiento">
              <Dato icon={<CalendarDays size={15}/>} label="Ingreso" value={fechaCorta(registro.fecha_ingreso)}/>
              <Dato label="Salida" value={fechaCorta(registro.fecha_salida)}/>
              <Dato label="Último cambio de ubicación" value={fechaCorta(registro.fecha_actualizacion_ubicacion)}/>
              <Dato icon={<Clock3 size={15}/>} label="Tiempo de seguimiento" value={textoSeguimiento(registro)}/>
            </Grupo>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Resumen label="Plazo establecido" value={registro.plazo_dias ? `${registro.plazo_dias} días` : "Sin plazo"}/>
            <Resumen label="Prioridad" value={registro.prioridad.toUpperCase()}/>
            <Resumen label="Plazo definido el" value={fechaCorta(registro.plazo_definido_en)}/>
          </div>
          <Grupo titulo="Observaciones / requerimiento"><p className="whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-slate-700">{registro.observaciones || "Sin observaciones registradas."}</p></Grupo>
          {accion && autoridad && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <h3 className="font-bold text-[#0b2b4a]">{accion === "plazo" ? "Determinar plazos" : "Determinar prioridad"}</h3>
              {accion === "plazo" ? <>
                <label htmlFor="detalle-plazo" className="mt-3 block text-sm font-semibold text-slate-700">Plazo en días</label>
                <input id="detalle-plazo" type="number" min="1" max="3650" step="1" value={plazo} onChange={(e) => setPlazo(e.target.value)} disabled={guardando} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2" placeholder="Sin plazo"/>
                <p className="mt-2 text-xs text-slate-600">Se cuenta desde la fecha de ingreso: {fechaCorta(registro.fecha_ingreso)}. Dejá el campo vacío para quitar el plazo.</p>
              </> : <>
                <label htmlFor="detalle-prioridad" className="mt-3 block text-sm font-semibold text-slate-700">Prioridad del expediente</label>
                <select id="detalle-prioridad" value={prioridad} onChange={(e) => setPrioridad(e.target.value as Expediente["prioridad"])} disabled={guardando} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
                </select>
              </>}
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" disabled={guardando} onClick={() => { setAccion(null); setError(""); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold">Cancelar</button>
                <button type="button" disabled={guardando} onClick={guardar} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{guardando ? "Guardando…" : "Guardar"}</button>
              </div>
            </div>
          )}
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          {mensaje && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{mensaje}</p>}
          {(autoridad || onEdit || onMove) && <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            {autoridad ? <>
              <button type="button" disabled={guardando} onClick={() => abrirAccion("plazo")} className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-bold text-sky-800"><Clock3 size={16}/> Determinar plazos</button>
              <button type="button" disabled={guardando} onClick={() => abrirAccion("prioridad")} className="inline-flex items-center gap-2 rounded-xl bg-[#0b2b4a] px-4 py-2.5 text-sm font-bold text-white"><Flag size={16}/> Prioridad</button>
            </> : <>
              {onMove && <button type="button" onClick={() => onMove(registro)} className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-bold text-sky-800"><Route size={16}/> Actualizar ubicación</button>}
              {onEdit && <button type="button" onClick={() => onEdit(registro)} className="inline-flex items-center gap-2 rounded-xl bg-[#0b2b4a] px-4 py-2.5 text-sm font-bold text-white"><Pencil size={16}/> Editar expediente</button>}
            </>}
          </footer>}
        </div>
        </div>
      </section>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-sky-700">{titulo}</h3>{children}</section>;
}
function Dato({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3 border-t border-slate-100 py-2.5 first:border-t-0"><dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">{icon}{label}</dt><dd className="break-words text-sm font-bold text-slate-700">{value}</dd></dl>;
}
function Resumen({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 break-words text-lg font-bold text-[#0b2b4a]">{value}</p></div>;
}
