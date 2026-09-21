"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import ExpedienteDetalleModal from "@/components/ExpedienteDetalleModal";
import ExpedienteForm from "@/components/ExpedienteForm";
import JefeGuard from "@/components/JefeGuard";
import MovimientoExpedienteModal from "@/components/MovimientoExpedienteModal";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/hooks/usePerfil";
import {
  estadoAlerta,
  fechaCorta,
  textoSeguimiento,
} from "@/lib/expedientes";
import type { Expediente } from "@/lib/types";

export default function Dashboard() {
  const { perfil } = usePerfil();

  const [items, setItems] = useState<Expediente[]>([]);
  const [modal, setModal] = useState(false);
  const [detalle, setDetalle] = useState<Expediente | null>(null);
  const [moviendo, setMoviendo] = useState<Expediente | null>(null);
  const [editando, setEditando] = useState<Expediente | null>(null);
  const [filtroDashboard, setFiltroDashboard] = useState<
    "todos" | "tramite" | "amarillo" | "rojo" | "finalizados"
  >("todos");

  async function cargar() {
    const { data } = await supabase
      .from("expedientes")
      .select("*")
      .neq("estado", "archivado")
      .order("updated_at", { ascending: false })
      .limit(100);

    setItems((data as Expediente[]) ?? []);
  }

  useEffect(() => {
    cargar();
  }, []);

  const kpis = useMemo(() => {
    const enTramite = items.filter((x) => x.estado === "en_tramite").length;
    const vencidos = items.filter(
      (x) => estadoAlerta(x).nivel === "rojo",
    ).length;
    const proximos = items.filter(
      (x) => estadoAlerta(x).nivel === "amarillo",
    ).length;
    const finalizados = items.filter(
      (x) => x.estado === "finalizado",
    ).length;

    return { enTramite, vencidos, proximos, finalizados };
  }, [items]);

  const alertas = useMemo(
    () =>
      items
        .filter((x) => estadoAlerta(x).nivel !== "ok")
        .sort((a, b) => {
          const nivelA = estadoAlerta(a).nivel === "rojo" ? 2 : 1;
          const nivelB = estadoAlerta(b).nivel === "rojo" ? 2 : 1;
          if (nivelB !== nivelA) return nivelB - nivelA;
          return (
            new Date(a.fecha_ingreso).getTime() -
            new Date(b.fecha_ingreso).getTime()
          );
        }),
    [items],
  );

  const expedientesDashboard = useMemo(() => {
    if (filtroDashboard === "tramite") {
      return items.filter((x) => x.estado === "en_tramite");
    }

    if (filtroDashboard === "amarillo") {
      return items.filter((x) => estadoAlerta(x).nivel === "amarillo");
    }

    if (filtroDashboard === "rojo") {
      return items.filter((x) => estadoAlerta(x).nivel === "rojo");
    }

    if (filtroDashboard === "finalizados") {
      return items.filter((x) => x.estado === "finalizado");
    }

    return items;
  }, [items, filtroDashboard]);

  function abrirEditar(e: Expediente) {
    setDetalle(null);
    setEditando(e);
    setModal(true);
  }

  function abrirMover(e: Expediente) {
    setDetalle(null);
    setMoviendo(e);
  }

  return (
    <JefeGuard>
      <AppShell>
        <div className="p-4 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-500">
                Panel del Jefe
              </div>
              <h2 className="text-3xl font-bold text-[#0b2b4a]">
                Seguimiento de expedientes
              </h2>
            </div>

            <button
              onClick={() => {
                setEditando(null);
                setModal(true);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-bold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-600"
            >
              <Plus size={17}/>
              Nuevo expediente
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Kpi
              active={filtroDashboard === "tramite"}
              onClick={() =>
                setFiltroDashboard(
                  filtroDashboard === "tramite" ? "todos" : "tramite",
                )
              }
              icon={<FileText/>}
              label="En trámite"
              value={kpis.enTramite}
              tone="blue"
            />
            <Kpi
              active={filtroDashboard === "amarillo"}
              onClick={() =>
                setFiltroDashboard(
                  filtroDashboard === "amarillo" ? "todos" : "amarillo",
                )
              }
              icon={<Clock3/>}
              label="Próximos a vencer"
              value={kpis.proximos}
              tone="yellow"
            />
            <Kpi
              active={filtroDashboard === "rojo"}
              onClick={() =>
                setFiltroDashboard(
                  filtroDashboard === "rojo" ? "todos" : "rojo",
                )
              }
              icon={<AlertTriangle/>}
              label="Vencidos"
              value={kpis.vencidos}
              tone="red"
            />
            <Kpi
              active={filtroDashboard === "finalizados"}
              onClick={() =>
                setFiltroDashboard(
                  filtroDashboard === "finalizados"
                    ? "todos"
                    : "finalizados",
                )
              }
              icon={<CheckCircle2/>}
              label="Finalizados"
              value={kpis.finalizados}
              tone="green"
            />
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-red-600">
                  Control de plazos
                </div>
                <div className="text-xl font-bold text-[#0b2b4a]">
                  Alertas activas
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFiltroDashboard("rojo")}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100"
              >
                Mostrar vencidos
              </button>
            </div>

            {alertas.length === 0 ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-700">
                No hay expedientes con alertas de plazo activas.
              </div>
            ) : (
              <div className="space-y-2">
                {alertas.slice(0, 5).map((e) => {
                  const alerta = estadoAlerta(e);

                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setDetalle(e)}
                      className={`ui-card grid w-full gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-left md:grid-cols-[145px_minmax(180px,1fr)_145px_160px] md:items-center ${
                        alerta.nivel === "rojo"
                          ? "bg-red-50/80"
                          : "bg-amber-50/80"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {alerta.nivel === "rojo" ? (
                          <AlertTriangle
                            size={17}
                            className="deadline-alert-icon text-red-600"
                          />
                        ) : (
                          <Clock3 size={17} className="text-amber-600" />
                        )}
                        <span className="font-mono text-sm font-bold text-[#0b2b4a]">
                          {e.numero}/{e.anio}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-800">
                          {e.caratula || "Sin carátula"}
                        </div>
                        <div className="truncate text-xs font-semibold text-slate-500">
                          {e.ubicacion_actual}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase text-slate-400">
                          Plazo
                        </div>
                        <div className="text-sm font-bold text-slate-700">
                          {e.plazo_dias ? `${e.plazo_dias} días` : "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase text-slate-400">
                          Seguimiento
                        </div>
                        <div
                          className={`text-sm font-bold ${
                            alerta.nivel === "rojo"
                              ? "text-red-700"
                              : "text-amber-700"
                          }`}
                        >
                          {textoSeguimiento(e)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-sky-600">
                  Últimos movimientos
                </div>
                <div className="text-xl font-bold text-[#0b2b4a]">
                  {filtroDashboard === "todos"
                    ? "Expedientes recientes"
                    : filtroDashboard === "tramite"
                      ? "Expedientes en trámite"
                      : filtroDashboard === "amarillo"
                        ? "Próximos a vencer"
                        : filtroDashboard === "rojo"
                          ? "Expedientes vencidos"
                          : "Expedientes finalizados"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFiltroDashboard("todos")}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-sky-500 bg-white px-4 text-sm font-bold text-sky-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50 hover:shadow-md"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-2">
              {expedientesDashboard.slice(0, 12).map((e) => {
                const alerta = estadoAlerta(e);
                const urgente = e.prioridad === "urgente";

                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setDetalle(e)}
                    className={`ui-card grid w-full gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-left md:grid-cols-[75px_120px_minmax(180px,1.5fr)_160px_105px_105px_180px] md:items-center ${
                      urgente
                        ? "urgent-row"
                        : alerta.nivel === "amarillo"
                          ? "alert-yellow"
                          : "bg-white hover:bg-sky-50"
                    }`}
                  >
                    <div className="text-xs font-bold uppercase text-sky-700">
                      {e.tipo}
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-[#0b2b4a]">
                      {alerta.nivel === "rojo" && (
                        <AlertTriangle
                          size={15}
                          className="deadline-alert-icon text-red-600"
                        />
                      )}
                      {e.numero}/{e.anio}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-800">
                        {e.caratula || "Sin carátula"}
                      </div>
                      <div className="truncate text-xs font-semibold text-slate-500">
                        {e.area_solicitante} →{" "}
                        {e.dependencia_solicitante || "Sin destino"}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase text-slate-400">
                        Lugar
                      </div>
                      <div className="truncate text-sm font-bold text-slate-700">
                        {e.ubicacion_actual}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase text-slate-400">
                        Prioridad
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {e.prioridad.toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase text-slate-400">
                        Plazo
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {e.plazo_dias ? `${e.plazo_dias} días` : "Sin plazo"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase text-slate-400">
                        Seguimiento
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {fechaCorta(e.fecha_ingreso)}
                      </div>
                      <div
                        className={`text-xs font-bold ${
                          alerta.nivel === "rojo"
                            ? "text-red-600"
                            : alerta.nivel === "amarillo"
                              ? "text-amber-600"
                              : "text-sky-700"
                        }`}
                      >
                        {textoSeguimiento(e)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {perfil && (
          <ExpedienteForm
            abierto={modal}
            onClose={() => setModal(false)}
            onSaved={cargar}
            rol={perfil.rol}
            expediente={editando}
          />
        )}

        <ExpedienteDetalleModal
          expediente={detalle}
          onClose={() => setDetalle(null)}
          onEdit={abrirEditar}
          onMove={abrirMover}
        />

        <MovimientoExpedienteModal
          expediente={moviendo}
          onClose={() => setMoviendo(null)}
          onSaved={cargar}
        />
      </AppShell>
    </JefeGuard>
  );
}

function Kpi({
  onClick,
  active,
  icon,
  label,
  value,
  tone,
}: {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "blue" | "yellow" | "red" | "green";
}) {
  const map = {
    blue: "bg-sky-50 text-sky-700 border-sky-100",
    yellow: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`ui-card rounded-2xl border p-4 text-left ${map[tone]} ${
        active ? "ring-2 ring-sky-400 ring-offset-2" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-white/80 p-2 shadow-sm">{icon}</div>
        <div className="text-4xl font-bold">{value}</div>
      </div>
      <div className="mt-3 text-base font-bold">{label}</div>
    </button>
  );
}
