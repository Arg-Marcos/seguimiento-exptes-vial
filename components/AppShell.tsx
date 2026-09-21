"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  FileText,
  Gauge,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { limpiarPerfilCache, usePerfil } from "@/hooks/usePerfil";

const navJefe = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/expedientes", label: "Expedientes", icon: FileText },
  { href: "/dependencias", label: "Dependencias", icon: Building2 },
  { href: "/alertas", label: "Alertas automáticas", icon: Bell },
];

const navMesa = [
  { href: "/expedientes", label: "Expedientes", icon: FileText },
  { href: "/dependencias", label: "Dependencias", icon: Building2 },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { perfil } = usePerfil();

  const nav = perfil?.rol === "jefe" ? navJefe : navMesa;

  async function salir() {
    limpiarPerfilCache();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="app-shell">
      <aside className="desktop-only relative min-h-screen overflow-hidden bg-[#082845] text-white">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-500/20 to-transparent" />

        <div className="relative border-b border-white/10 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[104px] w-[104px] shrink-0 items-center justify-center">
              <img
                src="/escudo-dgsv.png"
                alt="DGSV"
                className="h-[102px] w-[102px] object-contain drop-shadow-xl"
              />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-bold tracking-[.15em] text-sky-300">
                POLICÍA DE SALTA
              </div>
              <div className="mt-1 text-2xl font-bold leading-none">
                Seguridad Vial
              </div>
            </div>
          </div>
        </div>

        <nav className="relative p-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                prefetch
                className={`mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 hover:translate-x-0.5 ${
                  active
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-950/20"
                    : "text-slate-200 hover:bg-white/8"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
              <ShieldCheck size={16} />
              {perfil?.rol === "jefe" ? "PERFIL JEFE" : "MESA DE ENTRADA"}
            </div>

            <div className="mt-1 truncate text-sm font-semibold">
              {perfil?.nombre ?? "Usuario"}
            </div>

            <button
              onClick={salir}
              className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-7">
            <div className="flex items-center gap-3">
              <img
                src="/escudo-dgsv.png"
                alt=""
                className="h-14 w-14 object-contain md:hidden"
              />

              <div>
                <div className="text-xs font-bold uppercase tracking-[.18em] text-sky-600">
                  Dirección General de Seguridad Vial
                </div>
                <h1 className="text-xl font-bold text-[#0b2b4a] md:text-2xl">
                  Seguimiento de Exptes.
                </h1>
              </div>
            </div>

            <div className="rounded-xl bg-sky-50 px-3 py-2 text-right">
              <div className="text-xs font-bold uppercase tracking-wide text-sky-600">
                {perfil?.rol === "jefe" ? "Jefe" : "Mesa de Entrada"}
              </div>
              <div className="text-xs font-semibold text-slate-700">
                {perfil?.nombre ?? "Usuario"}
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
