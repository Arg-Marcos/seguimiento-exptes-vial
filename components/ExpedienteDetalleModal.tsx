"use client";

import { AlertTriangle, CalendarDays, Clock3, MapPin, Pencil, Route, X } from "lucide-react";
import { estadoAlerta, fechaCorta, textoSeguimiento } from "@/lib/expedientes";
import type { Expediente } from "@/lib/types";

type Props = {
  expediente: Expediente | null;
  onClose: () => void;
  onEdit?: (expediente: Expediente) => void;
  onMove?: (expediente: Expediente) => void;
};

export default function ExpedienteDetalleModal({
  expediente,
  onClose,
  onEdit,
  onMove,
}: Props) {
  if (!expediente) return null;

  const alerta = estadoAlerta(expediente);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-3"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-sky-100 px-2 py-1 text-xs font-bold uppercase text-sky-700">
                  {expediente.tipo}
                </span>
                <span className="font-mono text-sm font-bold text-[#0b2b4a]">
                  {expediente.numero}/{expediente.anio}
                </span>
                {alerta.nivel === "rojo" && (
                  <AlertTriangle className="deadline-alert-icon text-red-600" size={18} />
                )}
              </div>
              <h2 className="mt-2 text-2xl font-bold leading-tight text-[#0b2b4a]">
                {expediente.caratula || "Sin carátula"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {expediente.observaciones && (
            <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-sky-700">
                Observaciones / requerimiento
              </div>
              <div className="mt-1 whitespace-pre-wrap text-base font-semibold leading-relaxed text-slate-800">
                {expediente.observaciones}
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <Dato icon={<CalendarDays size={16}/>} label="Fecha de ingreso" value={fechaCorta(expediente.fecha_ingreso)} />
            <Dato icon={<CalendarDays size={16}/>} label="Fecha de salida" value={fechaCorta(expediente.fecha_salida)} />
            <Dato icon={<Clock3 size={16}/>} label="Seguimiento" value={`${fechaCorta(expediente.fecha_ingreso)} · ${textoSeguimiento(expediente)}`} />
            <Dato label="Área procedente" value={expediente.area_solicitante || "—"} />
            <Dato label="Área destino" value={expediente.dependencia_solicitante || "Sin destino definido"} />
            <Dato icon={<MapPin size={16}/>} label="Ubicación actual" value={expediente.ubicacion_actual} />
            <Dato label="Prioridad" value={expediente.prioridad.toUpperCase()} />
            <Dato label="Estado" value={expediente.estado.replace("_", " ").toUpperCase()} />
            <Dato label="Plazo" value={expediente.plazo_dias ? `${expediente.plazo_dias} días` : "Sin plazo"} />
          </div>

          {(onEdit || onMove) && (
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
              {onMove && (
                <button
                  type="button"
                  onClick={() => onMove(expediente)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-700 transition hover:-translate-y-0.5 hover:bg-sky-100"
                >
                  <Route size={16} />
                  Actualizar ubicación
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(expediente)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b2b4a] px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#123f69]"
                >
                  <Pencil size={16} />
                  Editar expediente
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Dato({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-slate-700">{value}</div>
    </div>
  );
}
