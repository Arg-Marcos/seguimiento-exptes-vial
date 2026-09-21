"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Dependencia, Expediente, Rol } from "@/lib/types";

const AREAS = [
  "Mesa de Entrada",
  "Dirección General",
  "Departamento Operaciones",
  "Departamento Administrativo",
  "Educación Vial",
  "Control y Fiscalización",
  "Otro",
];

const UBICACIONES = [
  "Mesa de Entrada",
  "Dirección General",
  "Departamento Operaciones",
  "Departamento Administrativo",
  "Asesoría Legal",
  "Archivo",
  "Otro",
];

type Props = {
  abierto: boolean;
  onClose: () => void;
  onSaved: () => void;
  rol: Rol;
  expediente?: Expediente | null;
};

export default function ExpedienteForm({ abierto, onClose, onSaved, rol, expediente }: Props) {
  const [deps, setDeps] = useState<Dependencia[]>([]);
  const [tipo, setTipo] = useState("Expte.");
  const [numero, setNumero] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [fechaSalida, setFechaSalida] = useState(new Date().toISOString().slice(0,10));
  const [area, setArea] = useState("Mesa de Entrada");
  const [areaOtro, setAreaOtro] = useState("");
  const [depId, setDepId] = useState("");
  const [prioridad, setPrioridad] = useState<Expediente["prioridad"]>("normal");
  const [ubicacion, setUbicacion] = useState("Mesa de Entrada");
  const [ubicacionOtro, setUbicacionOtro] = useState("");
  const [estado, setEstado] = useState<Expediente["estado"]>("en_tramite");
  const [observaciones, setObservaciones] = useState("");
  const [plazoDias, setPlazoDias] = useState("");
  const [nuevoDep, setNuevoDep] = useState("");
  const [modalDep, setModalDep] = useState(false);
  const [saving, setSaving] = useState(false);

  const depSeleccionada = useMemo(() => deps.find(d => d.id === depId) ?? null, [deps, depId]);

  async function cargarDeps() {
    const { data } = await supabase.from("dependencias").select("id,nombre,activo").eq("activo", true).order("nombre");
    setDeps((data as Dependencia[]) ?? []);
  }

  useEffect(() => {
    if (!abierto) return;
    cargarDeps();

    if (expediente) {
      setTipo(expediente.tipo);
      setNumero(expediente.numero);
      setAnio(String(expediente.anio));
      setFechaSalida(expediente.fecha_salida);
      setArea(AREAS.includes(expediente.area_solicitante) ? expediente.area_solicitante : "Otro");
      setAreaOtro(AREAS.includes(expediente.area_solicitante) ? "" : expediente.area_solicitante);
      setDepId(expediente.dependencia_id ?? "");
      setPrioridad(expediente.prioridad);
      setUbicacion(UBICACIONES.includes(expediente.ubicacion_actual) ? expediente.ubicacion_actual : "Otro");
      setUbicacionOtro(UBICACIONES.includes(expediente.ubicacion_actual) ? "" : expediente.ubicacion_actual);
      setEstado(expediente.estado);
      setObservaciones(expediente.observaciones ?? "");
      setPlazoDias(expediente.plazo_dias ? String(expediente.plazo_dias) : "");
    } else {
      setTipo("Expte.");
      setNumero("");
      setAnio(String(new Date().getFullYear()));
      setFechaSalida(new Date().toISOString().slice(0,10));
      setArea("Mesa de Entrada");
      setAreaOtro("");
      setDepId("");
      setPrioridad("normal");
      setUbicacion("Mesa de Entrada");
      setUbicacionOtro("");
      setEstado("en_tramite");
      setObservaciones("");
      setPlazoDias("");
    }
  }, [abierto, expediente]);

  async function agregarDependencia() {
    const nombre = nuevoDep.trim().replace(/\s+/g, " ").toUpperCase();
    if (!nombre) return;

    const existente = deps.find(d => d.nombre.toLowerCase() === nombre.toLowerCase());
    if (existente) {
      setDepId(existente.id);
      setModalDep(false);
      setNuevoDep("");
      return;
    }

    const { data, error } = await supabase.from("dependencias").insert({ nombre, activo: true }).select("id,nombre,activo").single();
    if (error) return alert(error.message);

    const dep = data as Dependencia;
    setDeps(prev => [...prev, dep].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es")));
    setDepId(dep.id);
    setModalDep(false);
    setNuevoDep("");
  }

  async function guardar() {
    if (!numero.trim() || !depSeleccionada) return alert("Completá número y dependencia.");

    const areaFinal = area === "Otro" ? areaOtro.trim() : area;
    const ubicacionFinal = ubicacion === "Otro" ? ubicacionOtro.trim() : ubicacion;
    if (!areaFinal || !ubicacionFinal) return alert("Completá área y ubicación.");

    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();

    const payload = {
      tipo,
      numero: numero.trim(),
      anio: Number(anio),
      fecha_salida: fechaSalida,
      area_solicitante: areaFinal,
      dependencia_id: depSeleccionada.id,
      dependencia_solicitante: depSeleccionada.nombre,
      prioridad,
      ubicacion_actual: ubicacionFinal,
      fecha_actualizacion_ubicacion: new Date().toISOString(),
      observaciones: observaciones.trim() || null,
      estado,
      plazo_dias: rol === "jefe" && plazoDias ? Number(plazoDias) : expediente?.plazo_dias ?? null,
      plazo_definido_en:
        rol === "jefe" && plazoDias
          ? expediente?.plazo_dias === Number(plazoDias) && expediente.plazo_definido_en
            ? expediente.plazo_definido_en
            : new Date().toISOString()
          : expediente?.plazo_definido_en ?? null,
      actualizado_por: auth.user?.id ?? null,
      ...(expediente ? {} : { creado_por: auth.user?.id ?? null }),
    };

    if (expediente) {
      const cambioUbicacion = expediente.ubicacion_actual !== ubicacionFinal;
      const { error } = await supabase.from("expedientes").update(payload).eq("id", expediente.id);
      if (error) {
        setSaving(false);
        return alert(error.message);
      }

      if (cambioUbicacion) {
        await supabase.from("historial_expedientes").insert({
          expediente_id: expediente.id,
          ubicacion_anterior: expediente.ubicacion_actual,
          ubicacion_nueva: ubicacionFinal,
          observacion: observaciones.trim() || null,
          usuario_id: auth.user?.id ?? null,
        });
      }
    } else {
      const { data, error } = await supabase.from("expedientes").insert(payload).select("id").single();
      if (error) {
        setSaving(false);
        return alert(error.message);
      }
      await supabase.from("historial_expedientes").insert({
        expediente_id: data.id,
        ubicacion_anterior: null,
        ubicacion_nueva: ubicacionFinal,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3" onClick={onClose}>
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[.16em] text-sky-600">{expediente ? "Editar expediente" : "Nuevo expediente"}</div>
            <h2 className="text-xl font-black text-[#0b2b4a]">{expediente ? `${expediente.tipo} ${expediente.numero}/${expediente.anio}` : "Registrar expediente"}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-600"><X size={18}/></button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Tipo"><select value={tipo} onChange={e=>setTipo(e.target.value)} className="input"><option>Expte.</option><option>Nota</option><option>Memo</option><option>Oficio</option></select></Field>
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <Field label="Número"><input value={numero} onChange={e=>setNumero(e.target.value)} className="input" /></Field>
            <Field label="Año"><input value={anio} onChange={e=>setAnio(e.target.value.replace(/\D/g,"").slice(0,4))} className="input" /></Field>
          </div>

          <Field label="Fecha de salida"><input type="date" value={fechaSalida} onChange={e=>setFechaSalida(e.target.value)} className="input" /></Field>
          <Field label="Prioridad"><select value={prioridad} onChange={e=>setPrioridad(e.target.value as Expediente["prioridad"])} className="input"><option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></Field>

          <Field label="Área solicitante"><select value={area} onChange={e=>setArea(e.target.value)} className="input">{AREAS.map(x=><option key={x}>{x}</option>)}</select>{area==="Otro" && <input value={areaOtro} onChange={e=>setAreaOtro(e.target.value)} placeholder="Escribir área…" className="input mt-2"/>}</Field>

          <Field label="Dependencia solicitante">
            <div className="flex gap-2">
              <select value={depId} onChange={e=>setDepId(e.target.value)} className="input min-w-0 flex-1"><option value="">Seleccionar…</option>{deps.map(d=><option key={d.id} value={d.id}>{d.nombre}</option>)}</select>
              <button type="button" onClick={()=>setModalDep(true)} className="rounded-xl border border-sky-200 bg-sky-50 px-3 font-black text-sky-700 hover:bg-sky-100"><Plus size={17}/></button>
            </div>
          </Field>

          <Field label="Ubicación actual"><select value={ubicacion} onChange={e=>setUbicacion(e.target.value)} className="input">{UBICACIONES.map(x=><option key={x}>{x}</option>)}</select>{ubicacion==="Otro" && <input value={ubicacionOtro} onChange={e=>setUbicacionOtro(e.target.value)} placeholder="Escribir ubicación…" className="input mt-2"/>}</Field>
          <Field label="Estado"><select value={estado} onChange={e=>setEstado(e.target.value as Expediente["estado"])} className="input"><option value="en_tramite">En trámite</option><option value="devuelto">Devuelto</option><option value="finalizado">Finalizado</option><option value="archivado">Archivado</option></select></Field>

          {rol === "jefe" && (
            <Field label="Plazo definido por Jefe">
              <select value={plazoDias} onChange={e=>setPlazoDias(e.target.value)} className="input">
                <option value="">Sin plazo especial</option>
                <option value="3">3 días</option>
                <option value="5">5 días</option>
                <option value="7">7 días</option>
              </select>
              <div className="mt-1 text-[11px] font-semibold text-slate-500">Al alcanzar el plazo: amarillo. Con 2 días de exceso: rojo.</div>
            </Field>
          )}

          <div className="md:col-span-2">
            <Field label="Observaciones"><textarea rows={4} value={observaciones} onChange={e=>setObservaciones(e.target.value)} className="input resize-y" /></Field>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
          <button onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700">Cancelar</button>
          <button onClick={guardar} disabled={saving} className="h-11 rounded-xl bg-sky-500 px-5 text-sm font-black text-white hover:bg-sky-600 disabled:opacity-50">{saving ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>

      {modalDep && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4" onClick={()=>setModalDep(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="text-xs font-black uppercase tracking-wide text-sky-600">Catálogo de dependencias</div>
            <h3 className="mt-1 text-xl font-black text-[#0b2b4a]">Agregar dependencia</h3>
            <input autoFocus value={nuevoDep} onChange={e=>setNuevoDep(e.target.value.toUpperCase())} placeholder="Ej.: SECCIÓN SEGURIDAD VIAL ORÁN" className="input mt-4" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setModalDep(false)} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold">Cancelar</button>
              <button onClick={agregarDependencia} className="h-10 rounded-xl bg-sky-500 px-4 text-sm font-black text-white">Guardar</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input { width:100%; min-height:44px; border:1px solid #d8e3ec; border-radius:12px; background:#f8fbfd; padding:10px 12px; outline:none; color:#102a43; }
        .input:focus { border-color:#10a9ef; box-shadow:0 0 0 3px rgba(16,169,239,.08); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-600">{label}</span>{children}</label>;
}
