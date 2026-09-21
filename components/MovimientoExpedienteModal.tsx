"use client";

import { useEffect, useState } from "react";
import { Plus, Route, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Dependencia, Expediente } from "@/lib/types";

type Props = {
  expediente: Expediente | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function MovimientoExpedienteModal({
  expediente,
  onClose,
  onSaved,
}: Props) {
  const [deps, setDeps] = useState<Dependencia[]>([]);
  const [destinoId, setDestinoId] = useState("");
  const [otro, setOtro] = useState("");
  const [observacion, setObservacion] = useState("");
  const [modalDep, setModalDep] = useState(false);
  const [nuevoDep, setNuevoDep] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!expediente) return;
    setDestinoId("");
    setOtro("");
    setObservacion("");
    cargarDeps();
  }, [expediente]);

  async function cargarDeps() {
    const { data } = await supabase
      .from("dependencias")
      .select("id,nombre,activo")
      .eq("activo", true)
      .order("nombre");
    setDeps((data as Dependencia[]) ?? []);
  }

  async function agregarDependencia() {
    const nombre = nuevoDep.trim().replace(/\s+/g, " ").toUpperCase();
    if (!nombre) return;

    const existente = deps.find(
      (d) => d.nombre.toLowerCase() === nombre.toLowerCase(),
    );

    if (existente) {
      setDestinoId(existente.id);
      setModalDep(false);
      setNuevoDep("");
      return;
    }

    const { data, error } = await supabase
      .from("dependencias")
      .insert({ nombre, activo: true })
      .select("id,nombre,activo")
      .single();

    if (error) return alert(error.message);

    const dep = data as Dependencia;
    setDeps((prev) =>
      [...prev, dep].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    );
    setDestinoId(dep.id);
    setModalDep(false);
    setNuevoDep("");
  }

  async function guardar() {
    if (!expediente) return;

    const dependencia = deps.find((d) => d.id === destinoId);
    const destinoFinal =
      destinoId === "__otro__" ? otro.trim() : dependencia?.nombre ?? "";

    if (!destinoFinal) return alert("Seleccioná la nueva ubicación.");

    setSaving(true);

    const { data: auth } = await supabase.auth.getUser();
    const ahora = new Date().toISOString();
    const { error } = await supabase
      .from("expedientes")
      .update({
        ubicacion_actual: destinoFinal,
        fecha_actualizacion_ubicacion: ahora,
        fecha_salida: expediente.fecha_salida,
        actualizado_por: auth.user?.id ?? null,
      })
      .eq("id", expediente.id);

    if (error) {
      setSaving(false);
      return alert(error.message);
    }

    const { error: histError } = await supabase
      .from("historial_expedientes")
      .insert({
        expediente_id: expediente.id,
        ubicacion_anterior: expediente.ubicacion_actual,
        ubicacion_nueva: destinoFinal,
        observacion: observacion.trim() || null,
        usuario_id: auth.user?.id ?? null,
      });

    setSaving(false);

    if (histError) return alert(histError.message);

    onSaved();
    onClose();
  }

  if (!expediente) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-3"
        onClick={onClose}
      >
        <div
          className="w-full max-w-xl rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-sky-600">
                Seguimiento
              </div>
              <h2 className="text-xl font-bold text-[#0b2b4a]">
                Dar salida / actualizar ubicación
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {expediente.tipo} {expediente.numero}/{expediente.anio} · {expediente.caratula}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-600"
            >
              <X size={18}/>
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-bold uppercase text-slate-400">
                Ubicación actual
              </div>
              <div className="mt-1 font-bold text-slate-700">
                {expediente.ubicacion_actual}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                Nueva ubicación / destino
              </span>
              <div className="flex gap-2">
                <select
                  value={destinoId}
                  onChange={(e) => setDestinoId(e.target.value)}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 font-semibold outline-none transition hover:border-sky-300 focus:border-sky-400"
                >
                  <option value="">Seleccionar…</option>
                  {deps.map((d) => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                  <option value="__otro__">OTRO</option>
                </select>
                <button
                  type="button"
                  onClick={() => setModalDep(true)}
                  className="rounded-xl border border-sky-200 bg-sky-50 px-3 text-sky-700 transition hover:-translate-y-0.5 hover:bg-sky-100"
                  title="Agregar dependencia"
                >
                  <Plus size={17}/>
                </button>
              </div>
              {destinoId === "__otro__" && (
                <input
                  value={otro}
                  onChange={(e) => setOtro(e.target.value.toUpperCase())}
                  placeholder="Escribir ubicación…"
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-sky-400"
                />
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                Observación del movimiento
              </span>
              <textarea
                rows={3}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Opcional"
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold outline-none focus:border-sky-400"
              />
            </label>

            {!expediente.fecha_salida && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                Este expediente todavía no tiene Fecha de salida. Editalo primero para definir la fecha y el Área destino.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 px-4 font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-4 font-bold text-white transition hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-50"
            >
              <Route size={16}/>
              {saving ? "Guardando…" : "Confirmar movimiento"}
            </button>
          </div>
        </div>
      </div>

      {modalDep && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setModalDep(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-bold uppercase tracking-wide text-sky-600">
              Catálogo
            </div>
            <h3 className="mt-1 text-xl font-bold text-[#0b2b4a]">
              Agregar dependencia
            </h3>
            <input
              autoFocus
              value={nuevoDep}
              onChange={(e) => setNuevoDep(e.target.value.toUpperCase())}
              className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-sky-400"
              placeholder="Ej.: SECCIÓN SEGURIDAD VIAL ORÁN"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setModalDep(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={agregarDependencia}
                className="h-10 rounded-xl bg-sky-500 px-4 font-bold text-white"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
