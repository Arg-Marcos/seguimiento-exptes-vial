"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Edit3,
  Filter,
  MapPin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { esAutoridad } from "@/lib/permisos";
import { cargarExpedientes } from "@/lib/cargarExpedientes";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import ExpedienteDetalleModal from "@/components/ExpedienteDetalleModal";
import ExpedienteForm from "@/components/ExpedienteForm";
import MovimientoExpedienteModal from "@/components/MovimientoExpedienteModal";
import { usePerfil } from "@/hooks/usePerfil";
import { supabase } from "@/lib/supabase";
import {
  estadoAlerta,
  fechaCorta,
  textoSeguimiento,
} from "@/lib/expedientes";
import type { Dependencia, Expediente, MesaEntrada } from "@/lib/types";

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resaltar(texto: string, q: string): React.ReactNode {
  const terminos = q.trim().split(/\s+/).filter(Boolean);
  if (terminos.length === 0) return texto;

  const patron = terminos
    .map((termino) =>
      termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    )
    .join("|");

  const regex = new RegExp(`(${patron})`, "gi");

  return texto.split(regex).map((parte, index) => {
    const coincide = terminos.some(
      (termino) => parte.toLowerCase() === termino.toLowerCase(),
    );

    return coincide ? (
      <mark
        key={`${parte}-${index}`}
        className="rounded bg-sky-100 px-0.5 font-bold text-sky-800"
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

  const [mesas, setMesas] = useState<MesaEntrada[]>([]);
  const [mesa, setMesa] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [items, setItems] = useState<Expediente[]>([]);
  const [deps, setDeps] = useState<Dependencia[]>([]);

  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [anio, setAnio] = useState("");
  const [dep, setDep] = useState("");

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Expediente | null>(null);
  const [detalle, setDetalle] = useState<Expediente | null>(null);
  const [moviendo, setMoviendo] = useState<Expediente | null>(null);

  async function cargar() {
    try {
    const [e, { data: d, error: de }, { data: m, error: me }] = await Promise.all([
      cargarExpedientes(),
      supabase.from("mesas_entrada").select("id,nombre,activo").order("nombre"),
      supabase
        .from("dependencias")
        .select("id,nombre,activo")
        .eq("activo", true)
        .order("nombre"),
    ]);

    if (de || me) throw de ?? me;
    setErrorCarga("");
    setMesas((d as MesaEntrada[]) ?? []);
    setItems(e);
    setDeps((m as Dependencia[]) ?? []);
    } catch (error) {
      setItems([]);
      setErrorCarga(error instanceof Error ? error.message : "No se pudieron cargar los expedientes. Revisá la migración y los permisos.");
    }
  }

  useEffect(() => {
    cargar();

    const p = new URLSearchParams(window.location.search);
    setEstado(p.get("estado") ?? "");
    setBuscar(p.get("buscar") ?? "");
  }, []);

  const filtrados = useMemo(
    () =>
      items.filter((x) => {
        const texto = normalizar(
          [
            x.tipo,
            x.numero,
            x.anio,
            x.caratula,
            x.area_solicitante,
            x.dependencia_solicitante,
            x.ubicacion_actual,
            x.observaciones,
          ]
            .filter(Boolean)
            .join(" "),
        );

        const terms = normalizar(buscar).split(/\s+/).filter(Boolean);

        if (terms.some((t) => !texto.includes(t))) return false;
        if (estado && x.estado !== estado) return false;
        if (prioridad && x.prioridad !== prioridad) return false;
        if (anio && String(x.anio) !== anio) return false;
        if (dep && x.dependencia_id !== dep) return false;
        if (mesa === "sin_asignar" ? !!x.mesa_id : mesa && x.mesa_id !== mesa) return false;

        return true;
      }),
    [items, buscar, estado, prioridad, anio, dep, mesa],
  );

  async function eliminar(e: Expediente) {
    if (!confirm(`¿Archivar ${e.tipo} ${e.numero}/${e.anio}?`)) return;

    const { error } = await supabase
      .from("expedientes")
      .update({ estado: "archivado" })
      .eq("id", e.id);

    if (error) return alert(error.message);
    cargar();
  }

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
    <AuthGuard>
      <AppShell>
        <div className="p-4 md:p-6">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[.16em] text-sky-600">
                {esAutoridad(perfil?.rol) ? "Todas las mesas de entrada" : mesas.find((m) => m.id === perfil?.mesa_id)?.nombre ?? "Mesa de Entrada"}
              </div>
              <h2 className="text-3xl font-bold text-[#0b2b4a]">
                Expedientes
              </h2>
            </div>

            <button
              onClick={() => {
                setEditando(null);
                setModal(true);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-sky-600"
            >
              <Plus size={17}/> Nuevo expediente
            </button>
          </div>

          {errorCarga && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-red-700">{errorCarga}</p>}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0b2b4a]">
              <Filter size={17} className="text-sky-600"/> Filtros
            </div>

            {esAutoridad(perfil?.rol) && (
              <select aria-label="Filtrar por mesa de entrada" value={mesa} onChange={(e) => setMesa(e.target.value)} className="filter-control filter mb-3 w-full">
                <option value="">Todas las mesas de entrada</option>
                {mesas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                <option value="sin_asignar">Sin mesa asignada (registros anteriores)</option>
              </select>
            )}
            <div className="grid gap-2 lg:grid-cols-[2fr_1fr_1fr_90px_1.25fr_auto]">
              <div className="filter-control flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                <Search size={16} className="text-slate-400"/>
                <input
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Número, carátula, área, ubicación…"
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                />
              </div>

              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="filter-control filter"
              >
                <option value="">Todos los estados</option>
                <option value="en_tramite">En trámite</option>
                <option value="devuelto">Devuelto</option>
                <option value="finalizado">Finalizado</option>
                <option value="archivado">Archivado</option>
              </select>

              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
                className="filter-control filter"
              >
                <option value="">Todas las prioridades</option>
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>

              <input
                value={anio}
                onChange={(e) =>
                  setAnio(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="Año"
                className="filter-control filter"
              />

              <select
                value={dep}
                onChange={(e) => setDep(e.target.value)}
                className="filter-control filter"
              >
                <option value="">Todas las áreas destino</option>
                {deps.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setBuscar("");
                  setEstado("");
                  setPrioridad("");
                  setAnio("");
                  setDep("");
                  setMesa("");
                }}
                className="filter-control h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-700"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-3 py-2 text-sm font-semibold text-slate-600">
              {filtrados.length} mostrados · {mesa ? items.filter((x) => mesa === "sin_asignar" ? !x.mesa_id : x.mesa_id === mesa).length : items.length} registrados {mesa ? "en la mesa seleccionada" : "en las mesas accesibles"}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-1220px border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2.5 py-2">N°</th>
                    <th className="px-2.5 py-2">Mesa de entrada</th>
                    <th className="px-2.5 py-2">Expediente</th>
                    <th className="px-2.5 py-2">Carátula</th>
                    <th className="px-2.5 py-2">Ingreso</th>
                    <th className="px-2.5 py-2">Área procedente</th>
                    <th className="px-2.5 py-2">Área destino</th>
                    <th className="px-2.5 py-2">Ubicación</th>
                    <th className="px-2.5 py-2">Seguimiento</th>
                    <th className="px-2.5 py-2">Prioridad</th>
                    <th className="px-2.5 py-2">Plazo</th>
                    <th className="px-2.5 py-2">Estado</th>
                    <th className="px-2.5 py-2">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filtrados.map((x, index) => {
                    const alerta = estadoAlerta(x);
                                        const urgente = x.prioridad === "urgente";

                    return (
                      <tr
                        key={x.id}
                        onClick={() => setDetalle(x)}
                        className={`expediente-row cursor-pointer border-t border-slate-100 text-[13px] ${
                          urgente
                            ? "urgent-row"
                            : alerta.nivel === "amarillo"
                              ? "bg-amber-50/35"
                              : ""
                        }`}
                      >
                        <td className="px-2.5 py-2 font-bold text-slate-500">{index + 1}</td>
                        <td className="px-2.5 py-2 text-xs font-semibold text-slate-600">{mesas.find((m) => m.id === x.mesa_id)?.nombre ?? "Sin asignar"}</td>
                        <td className="px-2.5 py-2">
                          <div className="flex items-center gap-1.5 font-bold text-[#0b2b4a]">
                            {alerta.nivel === "rojo" && (
                              <span title="Plazo excedido" className="inline-flex">
                                <AlertTriangle
                                  size={16}
                                  className="deadline-alert-icon shrink-0 text-red-600"
                                  aria-label="Plazo excedido"
                                />
                              </span>
                            )}
                            <span className="whitespace-nowrap">
                              {x.tipo} {x.numero}/{x.anio}
                            </span>
                          </div>
                        </td>

                        <td className="max-w-220px px-2.5 py-2">
                          <div className="truncate font-bold text-slate-700">
                            {resaltar(x.caratula || "Sin carátula", buscar)}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-2.5 py-2 font-semibold text-slate-600">
                          {fechaCorta(x.fecha_ingreso)}
                        </td>

                        <td className="max-w-160px px-2.5 py-2">
                          <div className="truncate font-semibold text-slate-700">
                            {resaltar(x.area_solicitante, buscar)}
                          </div>
                        </td>

                        <td className="max-w-160px px-2.5 py-2">
                          <div className="truncate font-semibold text-slate-700">
                            {resaltar(x.dependencia_solicitante || "Sin destino", buscar)}
                          </div>
                        </td>

                        <td className="max-w-150px px-2.5 py-2">
                          <div className="truncate font-semibold text-slate-700">
                            {x.ubicacion_actual}
                          </div>
                        </td>

                        <td className="px-2.5 py-2">
                          <div className="whitespace-nowrap font-semibold text-slate-700">
                            {fechaCorta(x.fecha_ingreso)}
                          </div>
                          <div className={`text-xs font-bold ${
                            alerta.nivel === "rojo"
                              ? "text-red-600"
                              : alerta.nivel === "amarillo"
                                ? "text-amber-600"
                                : "text-sky-700"
                          }`}>
                            {textoSeguimiento(x)}
                          </div>
                        </td>

                        <td className="px-2.5 py-2">
                          <span className={`rounded-lg px-2 py-1 text-xs font-bold uppercase ${
                            x.prioridad === "urgente"
                              ? "bg-red-100 text-red-700"
                              : x.prioridad === "alta"
                                ? "bg-orange-100 text-orange-700"
                                : x.prioridad === "normal"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-blue-50 text-blue-700"
                          }`}>
                            {x.prioridad}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-2.5 py-2 font-bold text-slate-700">
                          {x.plazo_dias ? `${x.plazo_dias} días` : "—"}
                        </td>

                        <td className="px-2.5 py-2">
                          <span className="rounded-lg bg-sky-100 px-2 py-1 text-xs font-bold uppercase text-sky-700">
                            {x.estado.replace("_", " ")}
                          </span>
                        </td>

                        <td className="px-2.5 py-2">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirMover(x);
                              }}
                              title="Actualizar ubicación"
                              className="rounded-lg border border-slate-200 p-2 text-sky-700 transition hover:-translate-y-0.5 hover:bg-sky-50"
                            >
                              <MapPin size={15}/>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirEditar(x);
                              }}
                              title="Editar"
                              className="rounded-lg border border-slate-200 p-2 text-sky-700 transition hover:-translate-y-0.5 hover:bg-sky-50"
                            >
                              <Edit3 size={15}/>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminar(x);
                              }}
                              title="Archivar"
                              className="rounded-lg border border-slate-200 p-2 text-red-600 transition hover:-translate-y-0.5 hover:bg-red-50"
                            >
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {perfil && (
          <ExpedienteForm
            abierto={modal}
            onClose={() => setModal(false)}
            onSaved={cargar}
            rol={perfil.rol}
            mesaPerfilId={perfil.mesa_id}
            expediente={editando}
          />
        )}

        <ExpedienteDetalleModal
          expediente={detalle}
          onClose={() => setDetalle(null)}
          onEdit={abrirEditar}
          onMove={abrirMover}
          onSaved={cargar}
        />

        <MovimientoExpedienteModal
          expediente={moviendo}
          onClose={() => setMoviendo(null)}
          onSaved={cargar}
        />

        <style jsx>{`
          .filter {
            height: 40px;
            border: 1px solid #d8e3ec;
            border-radius: 12px;
            background: #f8fbfd;
            padding: 0 10px;
            outline: none;
            color: #334155;
            font-weight: 600;
          }
        `}</style>
      </AppShell>
    </AuthGuard>
  );
}
