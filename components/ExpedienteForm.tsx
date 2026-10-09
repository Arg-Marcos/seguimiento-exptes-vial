"use client";

import { esAutoridad } from "@/lib/permisos";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Dependencia, Expediente, Rol, MesaEntrada } from "@/lib/types";

type SelectorDestino = "procedente" | "destino";

type Props = {
  abierto: boolean;
  onClose: () => void;
  onSaved: () => void;
  rol: Rol;
  mesaPerfilId: string | null;
  expediente?: Expediente | null;
};

export default function ExpedienteForm({
  abierto,
  onClose,
  onSaved,
  rol,
  mesaPerfilId,
  expediente,
}: Props) {
  const hoy = new Date().toISOString().slice(0, 10);

  const [mesas, setMesas] = useState<MesaEntrada[]>([]);
  const [mesaId, setMesaId] = useState("");
  useEffect(() => {
    if (!abierto) return;
    setMesaId(expediente?.mesa_id ?? mesaPerfilId ?? "");
    supabase.from("mesas_entrada").select("id,nombre,activo").eq("activo", true).order("nombre").then(({ data }) => setMesas(data ?? []));
  }, [abierto, expediente, mesaPerfilId]);

  const [deps, setDeps] = useState<Dependencia[]>([]);
  const [tipo, setTipo] = useState("SICE");
  const [tipoOtro, setTipoOtro] = useState("");
  const tipoFinal = tipo === "OTRO" ? tipoOtro.trim().replace(/\s+/g, " ") : tipo;
  const [numero, setNumero] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [caratula, setCaratula] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState(hoy);
  const [fechaSalida, setFechaSalida] = useState("");
  const [areaProcedenteId, setAreaProcedenteId] = useState("");
  const [areaDestinoId, setAreaDestinoId] = useState("");
  const [prioridad, setPrioridad] =
    useState<Expediente["prioridad"]>("normal");
  const [estado, setEstado] =
    useState<Expediente["estado"]>("en_tramite");
  const [observaciones, setObservaciones] = useState("");

  const [plazoOpcion, setPlazoOpcion] = useState("");
  const [plazoOtro, setPlazoOtro] = useState("");

  const [nuevoDep, setNuevoDep] = useState("");
  const [destinoDep, setDestinoDep] =
    useState<SelectorDestino>("destino");
  const [modalDep, setModalDep] = useState(false);
  const [saving, setSaving] = useState(false);

  const areaProcedente = useMemo(
    () => deps.find((d) => d.id === areaProcedenteId) ?? null,
    [deps, areaProcedenteId],
  );

  const areaDestino = useMemo(
    () => deps.find((d) => d.id === areaDestinoId) ?? null,
    [deps, areaDestinoId],
  );

  async function cargarDeps() {
    const { data } = await supabase
      .from("dependencias")
      .select("id,nombre,activo")
      .eq("activo", true)
      .order("nombre");

    setDeps((data as Dependencia[]) ?? []);
  }

  useEffect(() => {
    if (!abierto) return;
    cargarDeps();

    if (expediente) {
      const estandar = ["SICE", "SEPS"].includes(expediente.tipo.toUpperCase());
      setTipo(estandar ? expediente.tipo.toUpperCase() : "OTRO");
      setTipoOtro(estandar ? "" : expediente.tipo);
      setNumero(expediente.numero);
      setAnio(String(expediente.anio));
      setCaratula(expediente.caratula ?? "");
      setFechaIngreso(
        expediente.fecha_ingreso || expediente.created_at.slice(0, 10),
      );
      setFechaSalida(expediente.fecha_salida ?? "");
      setAreaProcedenteId(expediente.area_procedente_id ?? "");
      setAreaDestinoId(expediente.dependencia_id ?? "");
      setPrioridad(expediente.prioridad);
      setEstado(expediente.estado);
      setObservaciones(expediente.observaciones ?? "");

      const plazo = expediente.plazo_dias;
      if (!plazo) {
        setPlazoOpcion("");
        setPlazoOtro("");
      } else if ([3, 5, 7].includes(plazo)) {
        setPlazoOpcion(String(plazo));
        setPlazoOtro("");
      } else {
        setPlazoOpcion("otro");
        setPlazoOtro(String(plazo));
      }
    } else {
      setTipo("SICE");
      setTipoOtro("");
      setNumero("");
      setAnio(String(new Date().getFullYear()));
      setCaratula("");
      setFechaIngreso(hoy);
      setFechaSalida("");
      setAreaProcedenteId("");
      setAreaDestinoId("");
      setPrioridad("normal");
      setEstado("en_tramite");
      setObservaciones("");
      setPlazoOpcion("");
      setPlazoOtro("");
    }
  }, [abierto, expediente, hoy]);

  useEffect(() => {
    if (!fechaSalida) {
      setAreaDestinoId("");
    }
  }, [fechaSalida]);

  function abrirNuevaDependencia(destino: SelectorDestino) {
    if (destino === "destino" && !fechaSalida) return;
    setDestinoDep(destino);
    setNuevoDep("");
    setModalDep(true);
  }

  async function agregarDependencia() {
    const nombre = nuevoDep.trim().replace(/\s+/g, " ").toUpperCase();
    if (!nombre) return;

    const existente = deps.find(
      (d) => d.nombre.toLowerCase() === nombre.toLowerCase(),
    );

    if (existente) {
      if (destinoDep === "procedente") setAreaProcedenteId(existente.id);
      else setAreaDestinoId(existente.id);
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

    if (destinoDep === "procedente") setAreaProcedenteId(dep.id);
    else setAreaDestinoId(dep.id);

    setModalDep(false);
    setNuevoDep("");
  }

  function plazoFinal() {
    if (!esAutoridad(rol)) return expediente?.plazo_dias ?? null;
    if (!plazoOpcion) return null;

    if (plazoOpcion === "otro") {
      const valor = Number(plazoOtro);
      return Number.isInteger(valor) && valor > 0 ? valor : null;
    }

    return Number(plazoOpcion);
  }

  async function guardar() {
    if (!tipoFinal) return alert("Especificá el tipo de expediente al seleccionar OTRO.");
    if (!numero.trim() || !caratula.trim()) {
      return alert("Completá número y carátula.");
    }

    if (!areaProcedente) {
      return alert("Seleccioná el Área procedente.");
    }

    if (fechaSalida && !areaDestino) {
      return alert(
        "Al indicar Fecha de salida también debés seleccionar el Área destino.",
      );
    }

    if (!mesaId) return alert("Seleccioná la mesa de entrada que registra el expediente.");
    const plazo = plazoFinal();

    if (esAutoridad(rol) && plazoOpcion === "otro" && !plazo) {
      return alert("Ingresá una cantidad válida de días para el plazo.");
    }

    setSaving(true);

    const { data: duplicado, error: duplicadoError } = await supabase
      .from("expedientes")
      .select("id")
      .eq("mesa_id", mesaId)
      .eq("tipo", tipoFinal)
      .eq("numero", numero.trim())
      .eq("anio", Number(anio))
      .neq(
        "id",
        expediente?.id ?? "00000000-0000-0000-0000-000000000000",
      )
      .maybeSingle();

    if (duplicadoError) {
      setSaving(false);
      return alert(duplicadoError.message);
    }

    if (duplicado) {
      setSaving(false);
      return alert(
        `Ya existe ${tipoFinal} ${numero.trim()}/${anio}. No se permiten expedientes duplicados dentro de la misma mesa.`,
      );
    }

    const { data: auth } = await supabase.auth.getUser();

    const cambioPlazo =
      esAutoridad(rol) &&
      plazo !== (expediente?.plazo_dias ?? null);

    const payload = {
      ...(expediente ? {} : { mesa_id: mesaId }),
      tipo: tipoFinal,
      numero: numero.trim(),
      anio: Number(anio),
      caratula: caratula.trim(),
      fecha_ingreso: fechaIngreso,
      fecha_salida: fechaSalida || null,
      area_procedente_id: areaProcedente.id,

      // Columnas históricas:
      // area_solicitante = Área procedente.
      // dependencia_* = Área destino.
      area_solicitante: areaProcedente.nombre,
      dependencia_id: fechaSalida ? areaDestino?.id ?? null : null,
      dependencia_solicitante: fechaSalida
        ? areaDestino?.nombre ?? null
        : null,

      prioridad:
        esAutoridad(rol)
          ? prioridad
          : expediente?.prioridad ?? "normal",

      observaciones: observaciones.trim() || null,
      estado,

      plazo_dias:
        esAutoridad(rol)
          ? plazo
          : expediente?.plazo_dias ?? null,

      // Se conserva para auditoría del momento en que el Jefe definió/cambió
      // el plazo, aunque el cálculo visual se realiza desde fecha_ingreso.
      plazo_definido_en:
        esAutoridad(rol)
          ? plazo
            ? cambioPlazo || !expediente?.plazo_definido_en
              ? new Date().toISOString()
              : expediente.plazo_definido_en
            : null
          : expediente?.plazo_definido_en ?? null,

      actualizado_por: auth.user?.id ?? null,

      ...(expediente
        ? {}
        : {
            creado_por: auth.user?.id ?? null,
            ubicacion_actual: "Mesa de Entrada",
            fecha_actualizacion_ubicacion: new Date().toISOString(),
          }),
    };

    if (expediente) {
      const { error } = await supabase
        .from("expedientes")
        .update(payload)
        .eq("id", expediente.id);

      if (error) {
        setSaving(false);

        if (error.code === "23505") {
          return alert(
            `Ya existe ${tipoFinal} ${numero.trim()}/${anio}. No se permiten expedientes duplicados dentro de la misma mesa.`,
          );
        }

        return alert(error.message);
      }
    } else {
      const { data, error } = await supabase
        .from("expedientes")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        setSaving(false);

        if (error.code === "23505") {
          return alert(
            `Ya existe ${tipoFinal} ${numero.trim()}/${anio}. No se permiten expedientes duplicados dentro de la misma mesa.`,
          );
        }

        return alert(error.message);
      }

      await supabase.from("historial_expedientes").insert({
        expediente_id: data.id,
        ubicacion_anterior: null,
        ubicacion_nueva: "Mesa de Entrada",
        observacion: "Alta del expediente",
        usuario_id: auth.user?.id ?? null,
      });
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  if (!abierto) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3"
        onClick={onClose}
      >
        <div
          className="modal-panel w-full max-w-3xl rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-scroll">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[.16em] text-sky-600">
                {expediente ? "Editar expediente" : "Nuevo expediente"}
              </div>
              <h2 className="text-2xl font-bold text-[#0b2b4a]">
                {expediente
                  ? `${expediente.tipo} ${expediente.numero}/${expediente.anio}`
                  : "Registrar expediente"}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            >
              <X size={18}/>
            </button>
          </div>

          <div className="grid gap-3 p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Mesa de entrada que registra">
                <select value={mesaId} onChange={(e) => setMesaId(e.target.value)} disabled={!!expediente || !esAutoridad(rol)} className="input">
                  <option value="">Seleccionar mesa de entrada</option>
                  {mesas.map((mesa) => <option key={mesa.id} value={mesa.id}>{mesa.nombre}</option>)}
                </select>
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Carátula">
                <input
                  value={caratula}
                  onChange={(e) => setCaratula(e.target.value)}
                  placeholder="Título / carátula del expediente"
                  className="input"
                />
              </Field>
            </div>

            <Field label="Fecha de ingreso">
              <input
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="input"
              />
            </Field>

            <div className="grid grid-cols-[120px_minmax(0,1fr)_95px] gap-2">
              <Field label="Tipo">
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="input"
                >
                  <option value="SICE">SICE</option>
                  <option value="SEPS">SEPS</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </Field>

              <Field label="Número">
                <input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Año">
                <input
                  value={anio}
                  inputMode="numeric"
                  onChange={(e) =>
                    setAnio(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  className="input"
                />
              </Field>
            </div>

            {tipo === "OTRO" && (
              <div className="md:col-span-2">
                <Field label="Especificar tipo de expediente">
                  <input value={tipoOtro} onChange={(e) => setTipoOtro(e.target.value)} placeholder="Por ejemplo: Oficio, Nota…" required className="input" />
                </Field>
              </div>
            )}

            <SelectorDependencia
              label="Área procedente"
              value={areaProcedenteId}
              onChange={setAreaProcedenteId}
              deps={deps}
              onAgregar={() => abrirNuevaDependencia("procedente")}
            />

            <Field label="Fecha de salida">
              <input
                type="date"
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
                className="input"
              />
            </Field>

            <SelectorDependencia
              label="Área destino"
              value={areaDestinoId}
              onChange={setAreaDestinoId}
              deps={deps}
              onAgregar={() => abrirNuevaDependencia("destino")}
              disabled={!fechaSalida}
              hint={
                !fechaSalida
                  ? "Se habilita al completar la Fecha de salida."
                  : undefined
              }
            />

            {esAutoridad(rol) && (
              <>
                <Field label="Prioridad">
                  <select
                    value={prioridad}
                    onChange={(e) =>
                      setPrioridad(
                        e.target.value as Expediente["prioridad"],
                      )
                    }
                    className="input"
                  >
                    <option value="baja">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </Field>

                <Field label="Establecer plazo">
                  <select
                    value={plazoOpcion}
                    onChange={(e) => setPlazoOpcion(e.target.value)}
                    className="input"
                  >
                    <option value="">Sin plazo</option>
                    <option value="3">3 días</option>
                    <option value="5">5 días</option>
                    <option value="7">7 días</option>
                    <option value="otro">Otro</option>
                  </select>

                  {plazoOpcion === "otro" && (
                    <input
                      value={plazoOtro}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      onChange={(e) =>
                        setPlazoOtro(
                          e.target.value.replace(/\D/g, "").slice(0, 4),
                        )
                      }
                      placeholder="Cantidad de días"
                      className="input mt-2"
                    />
                  )}
                </Field>
              </>
            )}

            <Field label="Estado">
              <select
                value={estado}
                onChange={(e) =>
                  setEstado(
                    e.target.value as Expediente["estado"],
                  )
                }
                className="input"
              >
                <option value="en_tramite">En trámite</option>
                <option value="devuelto">Devuelto</option>
                <option value="finalizado">Finalizado</option>
                <option value="archivado">Archivado</option>
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Observaciones / requerimiento">
                <textarea
                  rows={4}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalle de lo solicitado, requerimientos, aclaraciones…"
                  className="input resize-y"
                />
              </Field>
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
            <button
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              onClick={guardar}
              disabled={saving}
              className="h-11 rounded-xl bg-sky-500 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
          </div>
        </div>
      </div>

      {modalDep && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4"
          onClick={() => setModalDep(false)}
        >
          <div
            className="modal-panel w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-scroll p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-sky-600">
              Catálogo de dependencias
            </div>
            <h3 className="mt-1 text-xl font-bold text-[#0b2b4a]">
              Agregar dependencia
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Se agregará sin perder lo que ya cargaste en el expediente.
            </p>

            <input
              autoFocus
              value={nuevoDep}
              onChange={(e) =>
                setNuevoDep(e.target.value.toUpperCase())
              }
              placeholder="Ej.: SECCIÓN SEGURIDAD VIAL ORÁN"
              className="input mt-4"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setModalDep(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={agregarDependencia}
                className="h-10 rounded-xl bg-sky-500 px-4 text-sm font-bold text-white"
              >
                Guardar
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          min-height: 42px;
          border: 1px solid #d8e3ec;
          border-radius: 12px;
          background: #f8fbfd;
          padding: 9px 11px;
          outline: none;
          color: #102a43;
          font-weight: 600;
          transition:
            border-color .15s ease,
            box-shadow .15s ease,
            transform .15s ease,
            background-color .15s ease;
        }

        .input:hover:not(:disabled) {
          border-color: #9fdcf7;
        }

        .input:focus {
          border-color: #10a9ef;
          box-shadow: 0 0 0 3px rgba(16,169,239,.08);
        }

        .input:disabled {
          cursor: not-allowed;
          background: #eef2f6;
          color: #94a3b8;
        }
      `}</style>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectorDependencia({
  label,
  value,
  onChange,
  deps,
  onAgregar,
  disabled = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  deps: Dependencia[];
  onAgregar: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <Field label={label}>
      <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-[42px] min-w-0 w-full rounded-xl border border-[#d8e3ec] bg-[#f8fbfd] px-3 font-semibold text-[#102a43] outline-none transition-[border-color,box-shadow,background-color] hover:border-sky-300 focus:border-sky-400 focus:shadow-[0_0_0_3px_rgba(16,169,239,.08)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">Seleccionar…</option>
          {deps.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onAgregar}
          disabled={disabled}
          title="Agregar dependencia"
          className="flex h-[42px] w-[44px] items-center justify-center self-start rounded-xl border border-sky-200 bg-sky-50 text-sky-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-sky-100 hover:shadow disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
        >
          <Plus size={18}/>
        </button>
      </div>

      {hint && (
        <div className="mt-1 text-xs font-semibold text-slate-400">
          {hint}
        </div>
      )}
    </Field>
  );
}
