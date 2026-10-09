import type { Rol } from "@/lib/types";
export function esAutoridad(rol?: Rol) {
  return rol === "director" || rol === "jefe";
}
export function nombreRol(rol?: Rol) {
  return rol === "director" ? "Director" : rol === "jefe" ? "Jefe" : "Mesa de Entrada";
}
