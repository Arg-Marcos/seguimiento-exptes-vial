export type Rol = "director" | "jefe" | "mesa";

export type Perfil = {
  id: string;
  nombre: string;
  rol: Rol;
  mesa_id: string | null;
};

export type MesaEntrada = { id: string; nombre: string; activo: boolean };

export type Dependencia = {
  id: string;
  nombre: string;
  activo: boolean;
};

export type Expediente = {
  mesa_id: string | null;
  id: string;
  tipo: string;
  numero: string;
  anio: number;
  caratula: string;
  fecha_ingreso: string;
  fecha_salida: string | null;
  area_procedente_id: string | null;

  // Compatibilidad con el esquema existente:
  // area_solicitante = snapshot de Área procedente.
  // dependencia_* = Área destino.
  area_solicitante: string;
  dependencia_id: string | null;
  dependencia_solicitante: string | null;

  prioridad: "baja" | "normal" | "alta" | "urgente";
  ubicacion_actual: string;
  fecha_actualizacion_ubicacion: string;
  observaciones: string | null;
  estado: "en_tramite" | "devuelto" | "finalizado" | "archivado";
  plazo_dias: number | null;
  plazo_definido_en: string | null;
  creado_por: string | null;
  actualizado_por: string | null;
  created_at: string;
  updated_at: string;
};

export type HistorialExpediente = {
  id: string;
  expediente_id: string;
  ubicacion_anterior: string | null;
  ubicacion_nueva: string;
  observacion: string | null;
  usuario_id: string | null;
  created_at: string;
};

export type NivelAlerta = "ok" | "amarillo" | "rojo";
