import type { Expediente, NivelAlerta } from "@/lib/types";

function fechaLocal(fecha: string) {
  return fecha.includes("T") ? new Date(fecha) : new Date(`${fecha}T00:00:00`);
}

export function diasDesde(fecha?: string | null) {
  if (!fecha) return 0;

  const origen = fechaLocal(fecha);
  if (Number.isNaN(origen.getTime())) return 0;

  const hoy = new Date();
  const inicioHoy = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
  ).getTime();

  const inicioOrigen = new Date(
    origen.getFullYear(),
    origen.getMonth(),
    origen.getDate(),
  ).getTime();

  return Math.max(
    0,
    Math.floor((inicioHoy - inicioOrigen) / 86_400_000),
  );
}

export function diasEnUbicacion(expediente: Expediente) {
  return diasDesde(expediente.fecha_actualizacion_ubicacion);
}

export function diasEnSeguimiento(expediente: Expediente) {
  return diasDesde(expediente.fecha_ingreso);
}

export function estadoAlerta(expediente: Expediente): {
  nivel: NivelAlerta;
  diasTranscurridos: number;
  diasRestantes: number | null;
  diasExceso: number;
} {
  if (
    expediente.estado !== "en_tramite" ||
    !expediente.plazo_dias ||
    !expediente.fecha_ingreso
  ) {
    return {
      nivel: "ok",
      diasTranscurridos: diasEnSeguimiento(expediente),
      diasRestantes: null,
      diasExceso: 0,
    };
  }

  // El plazo se cuenta desde la FECHA DE INGRESO del expediente.
  // Así se puede cargar una fecha histórica y probar correctamente las alertas.
  const transcurridos = diasEnSeguimiento(expediente);
  const restantes = expediente.plazo_dias - transcurridos;
  const exceso = Math.max(0, transcurridos - expediente.plazo_dias);

  // 3 o 5 días: al llegar al plazo -> amarillo; 2 días después -> rojo.
  // 7 días: al alcanzar el plazo -> rojo.
  if (
    (expediente.plazo_dias === 7 && transcurridos >= 7) ||
    transcurridos >= expediente.plazo_dias + 2
  ) {
    return {
      nivel: "rojo",
      diasTranscurridos: transcurridos,
      diasRestantes: restantes,
      diasExceso: exceso,
    };
  }

  if (transcurridos >= expediente.plazo_dias) {
    return {
      nivel: "amarillo",
      diasTranscurridos: transcurridos,
      diasRestantes: restantes,
      diasExceso: exceso,
    };
  }

  return {
    nivel: "ok",
    diasTranscurridos: transcurridos,
    diasRestantes: restantes,
    diasExceso: 0,
  };
}

export function textoSeguimiento(expediente: Expediente) {
  const dias = diasEnSeguimiento(expediente);
  const alerta = estadoAlerta(expediente);

  const base =
    dias === 0 ? "Hoy" : dias === 1 ? "1 día" : `${dias} días`;

  if (alerta.diasExceso > 0) {
    return `${base} · Atrasado ${alerta.diasExceso} ${
      alerta.diasExceso === 1 ? "día" : "días"
    }`;
  }

  if (
    expediente.plazo_dias &&
    alerta.diasRestantes !== null &&
    alerta.diasRestantes > 0
  ) {
    return `${base} · Faltan ${alerta.diasRestantes} ${
      alerta.diasRestantes === 1 ? "día" : "días"
    }`;
  }

  return base;
}

export function fechaCorta(fecha?: string | null) {
  if (!fecha) return "—";
  const base = fechaLocal(fecha);
  if (Number.isNaN(base.getTime())) return "—";
  return base.toLocaleDateString("es-AR");
}
