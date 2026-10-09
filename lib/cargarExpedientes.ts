import { supabase } from "@/lib/supabase";
import type { Expediente } from "@/lib/types";
export async function cargarExpedientes(): Promise<Expediente[]> {
  const items: Expediente[] = [];
  const size = 500;
  for (let desde = 0; ; desde += size) {
    const { data, error } = await supabase.from("expedientes").select("*")
      .order("created_at", { ascending: false }).order("id", { ascending: false })
      .range(desde, desde + size - 1);
    if (error) throw error;
    items.push(...(data ?? []));
    if (!data || data.length < size) return items;
  }
}
