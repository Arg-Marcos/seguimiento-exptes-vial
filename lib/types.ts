export type Rol = "jefe" | "mesa";

export type Perfil = {
  id: string;
  nombre: string;
  rol: Rol;
};

export type Dependencia = {
  id: string;
  nombre: string;
  activo: boolean;
};

export type Expediente = {
  id: string;
  tipo: string;
  numero: string;
  anio: number;
  fecha_salida: string;
  area_solicitante: string;
  dependencia_id: string | null;
  dependencia_solicitante: string;
  prioridad: "baja" | "normal" | "alta" | "urgente";
  ubicacion_actual: string;
  fecha_actualizacion_ubicacion: string;
  observaciones: string | null;
  estado: "en_tramite" | "devuelto" | "finalizado" | "archivado";
  plazo_dias: 3 | 5 | 7 | null;
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
