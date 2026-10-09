"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3 } from "lucide-react";
import FiltroMesa from "@/components/FiltroMesa";
import { cargarExpedientes } from "@/lib/cargarExpedientes";
import AppShell from "@/components/AppShell";
import ExpedienteDetalleModal from "@/components/ExpedienteDetalleModal";
import JefeGuard from "@/components/JefeGuard";
import {
  estadoAlerta,
  fechaCorta,
  textoSeguimiento,
} from "@/lib/expedientes";
import type { Expediente } from "@/lib/types";

export default function AlertasPage() {
  const [mesa, setMesa] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [items, setItems] = useState<Expediente[]>([]);
  const [tipo, setTipo] = useState("");
  const [detalle, setDetalle] = useState<Expediente | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setTipo(p.get("tipo") ?? "");

    cargarExpedientes().then((data) => setItems(data.filter((x) => x.estado === "en_tramite"))).catch(() => setErrorCarga("No se pudieron cargar las alertas. Revisá los permisos y la conexión."));
  }, []);

  const alertas = useMemo(
    () =>
      items
        .filter((x) => {
          if (mesa && (mesa === "sin_asignar" ? !!x.mesa_id : x.mesa_id !== mesa)) return false;
          const nivel = estadoAlerta(x).nivel;
          if (nivel === "ok") return false;
          return !tipo || nivel === tipo;
        })
        .sort((a, b) => {
          const aNivel = estadoAlerta(a).nivel === "rojo" ? 2 : 1;
          const bNivel = estadoAlerta(b).nivel === "rojo" ? 2 : 1;
          if (bNivel !== aNivel) return bNivel - aNivel;
          return (
            new Date(a.fecha_ingreso).getTime() -
            new Date(b.fecha_ingreso).getTime()
          );
        }),
    [items, tipo, mesa],
  );

  return (
    <JefeGuard>
      <AppShell>
        <div className="p-4 md:p-7">
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-[.16em] text-sky-600">
              Control automático
            </div>
            <h2 className="text-3xl font-bold text-[#0b2b4a]">
              Alertas de plazos
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">
              Visible para Director y Jefe. Acá aparecen los expedientes que alcanzaron o superaron el plazo establecido.
            </p>
          </div>

          <FiltroMesa value={mesa} onChange={setMesa} />
          {errorCarga && <p role="alert" className="mb-3 text-red-700">{errorCarga}</p>}
          <div className="space-y-3">
            {alertas.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-semibold text-slate-500">
                No hay alertas activas.
              </div>
            )}

            {alertas.map((e) => {
              const a = estadoAlerta(e);

              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setDetalle(e)}
                  className={`ui-card w-full rounded-2xl border border-slate-200 p-4 text-left ${
                    a.nivel === "rojo"
                      ? "bg-red-50/80"
                      : "bg-amber-50/80"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {a.nivel === "rojo" ? (
                        <AlertTriangle
                          className="deadline-alert-icon shrink-0 text-red-600"
                        />
                      ) : (
                        <Clock3 className="shrink-0 text-amber-600" />
                      )}

                      <div className="min-w-0">
                        <div className="text-lg font-bold text-[#0b2b4a]">
                          {e.tipo} {e.numero}/{e.anio}
                        </div>
                        <div className="truncate text-sm font-bold text-slate-700">
                          {e.caratula || "Sin carátula"}
                        </div>
                        <div className="truncate text-sm font-semibold text-slate-500">
                          {e.ubicacion_actual}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold uppercase text-slate-400">
                        Fecha de ingreso
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {fechaCorta(e.fecha_ingreso)}
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-700">
                        Plazo: {e.plazo_dias} días
                      </div>
                      <div
                        className={`text-sm font-bold ${
                          a.nivel === "rojo"
                            ? "text-red-700"
                            : "text-amber-700"
                        }`}
                      >
                        {textoSeguimiento(e)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <ExpedienteDetalleModal
          expediente={detalle}
          onClose={() => setDetalle(null)}
        />
      </AppShell>
    </JefeGuard>
  );
}
