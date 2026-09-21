"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ingresar(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("No se pudo ingresar. Verificá usuario y contraseña.");
      setLoading(false);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setError("No se pudo identificar el perfil del usuario.");
      setLoading(false);
      return;
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", userId)
      .maybeSingle();

    router.replace(perfil?.rol === "jefe" ? "/" : "/expedientes");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071f36] px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,169,239,.24),transparent_24rem),radial-gradient(circle_at_80%_80%,rgba(37,99,235,.16),transparent_28rem)]" />
      <div className="absolute inset-x-0 bottom-0 h-28 opacity-25 [background-image:linear-gradient(90deg,transparent_0_6%,rgba(255,255,255,.5)_6%_12%,transparent_12%_18%)] [background-size:90px_24px]" />

      <section className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl shadow-black/25 md:p-8">
        <div className="mb-5 flex items-center justify-center gap-5">
          <img src="/escudo-policia.jpg" alt="Policía de Salta" className="h-20 w-20 rounded-2xl object-cover shadow-lg" />
          <div className="h-14 w-px bg-slate-200" />
          <img src="/escudo-dgsv.png" alt="Dirección General de Seguridad Vial" className="h-20 w-20 rounded-2xl object-cover shadow-lg" />
        </div>

        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-[.22em] text-sky-600">Policía de Salta · Seguridad Vial</div>
          <h1 className="mt-2 text-3xl font-bold text-[#0b2b4a]">Seguimiento de Exptes.</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Acceso interno para personal autorizado.</p>
        </div>

        <form onSubmit={ingresar} className="mt-7">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">Correo</label>
          <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
            <Mail size={17} className="text-slate-400" />
            <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required autoComplete="username" className="w-full bg-transparent font-semibold outline-none" />
          </div>

          <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-600">Contraseña</label>
          <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
            <LockKeyhole size={17} className="text-slate-400" />
            <input
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              type={mostrarPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
            />
            <button
              type="button"
              onClick={()=>setMostrarPassword((v)=>!v)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-sky-600"
              aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {mostrarPassword ? <EyeOff size={18}/> : <Eye size={18}/>} 
            </button>
          </div>

          {error && <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>}

          <button disabled={loading} className="mt-6 h-12 w-full rounded-xl bg-sky-500 text-base font-bold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-50">
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-400">
          <ShieldCheck size={16} className="text-sky-500" />
          Sistema institucional de seguimiento documental
        </div>
      </section>
    </main>
  );
}
