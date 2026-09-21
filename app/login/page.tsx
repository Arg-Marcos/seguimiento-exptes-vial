"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ingresar(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("No se pudo ingresar. Verificá usuario y contraseña.");
      setLoading(false);
      return;
    }

    router.replace("/");
  }

  return (
    <div className="grid min-h-screen bg-[#071f36] md:grid-cols-[1.15fr_.85fr]">
      <section className="relative hidden overflow-hidden md:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,169,239,.25),transparent_30rem)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-4">
            <img src="/escudo-dgsv.jpg" alt="Seguridad Vial" className="h-24 w-24 rounded-3xl object-cover shadow-2xl" />
            <div>
              <div className="text-sm font-black uppercase tracking-[.22em] text-sky-300">Policía de Salta</div>
              <div className="mt-2 text-3xl font-black">Dirección General de Seguridad Vial</div>
            </div>
          </div>
          <div>
            <div className="text-5xl font-black leading-tight">Seguimiento de<br/>Exptes.</div>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
              Seguimiento interno, ubicación, plazos, prioridades y trazabilidad documental.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <ShieldCheck size={18} className="text-sky-400" />
            Acceso restringido a personal autorizado
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-10">
        <form onSubmit={ingresar} className="w-full max-w-md">
          <img src="/escudo-dgsv.jpg" alt="" className="mx-auto mb-6 h-24 w-24 rounded-3xl object-cover md:hidden" />
          <div className="text-xs font-black uppercase tracking-[.18em] text-sky-600">Seguridad Vial</div>
          <h1 className="mt-2 text-3xl font-black text-[#0b2b4a]">Ingreso al sistema</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Usá tu cuenta institucional.</p>

          <label className="mt-8 block text-xs font-black uppercase tracking-wide text-slate-600">Correo</label>
          <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-sky-400">
            <Mail size={17} className="text-slate-400" />
            <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required className="w-full bg-transparent outline-none" />
          </div>

          <label className="mt-4 block text-xs font-black uppercase tracking-wide text-slate-600">Contraseña</label>
          <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-sky-400">
            <LockKeyhole size={17} className="text-slate-400" />
            <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required className="w-full bg-transparent outline-none" />
          </div>

          {error && <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>}

          <button disabled={loading} className="mt-6 h-12 w-full rounded-xl bg-sky-500 font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 disabled:opacity-50">
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </section>
    </div>
  );
}
