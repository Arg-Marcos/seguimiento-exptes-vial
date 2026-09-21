"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import type { Dependencia } from "@/lib/types";

export default function DependenciasPage() {
  const [items,setItems]=useState<Dependencia[]>([]);
  const [buscar,setBuscar]=useState("");
  const [nombre,setNombre]=useState("");

  async function cargar(){
    const {data}=await supabase.from("dependencias").select("id,nombre,activo").eq("activo",true).order("nombre");
    setItems((data as Dependencia[])??[]);
  }
  useEffect(()=>{cargar()},[]);

  async function agregar(){
    const n=nombre.trim().replace(/\s+/g," ").toUpperCase();
    if(!n)return;
    const {error}=await supabase.from("dependencias").insert({nombre:n,activo:true});
    if(error)return alert(error.message);
    setNombre(""); cargar();
  }
  async function desactivar(id:string){
    if(!confirm("¿Desactivar esta dependencia del catálogo?"))return;
    await supabase.from("dependencias").update({activo:false}).eq("id",id);
    cargar();
  }

  const filtrados=items.filter(x=>x.nombre.toLowerCase().includes(buscar.toLowerCase()));

  return <AuthGuard><AppShell><div className="p-4 md:p-7">
    <div className="mb-4"><div className="text-xs font-black uppercase tracking-[.16em] text-sky-600">Catálogo maestro</div><h2 className="text-2xl font-black text-[#0b2b4a]">Dependencias</h2><p className="mt-1 text-sm font-medium text-slate-500">Una sola denominación por dependencia para evitar duplicados en estadísticas y filtros.</p></div>

    <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-black text-[#0b2b4a]">Agregar dependencia</div>
        <input value={nombre} onChange={e=>setNombre(e.target.value.toUpperCase())} placeholder="SECCIÓN SEGURIDAD VIAL ORÁN" className="mt-3 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-sky-400"/>
        <button onClick={agregar} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-black text-white"><Plus size={16}/>Guardar</button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search size={16} className="text-slate-400"/><input value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="Buscar dependencia…" className="w-full bg-transparent text-sm outline-none"/></div>
        <div className="mt-3 divide-y divide-slate-100">
          {filtrados.map(x=><div key={x.id} className="flex items-center justify-between gap-3 py-3"><span className="text-sm font-bold text-slate-700">{x.nombre}</span><button onClick={()=>desactivar(x.id)} className="rounded-lg border border-slate-200 p-2 text-red-600"><Trash2 size={15}/></button></div>)}
        </div>
      </div>
    </div>
  </div></AppShell></AuthGuard>
}
