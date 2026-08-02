import { supabase } from "@/integrations/supabase/client";

export interface Soignant {
  id: string;
  user_id: string;
  cabinet_id: string | null;
  nom: string;
  prenom: string;
  email: string | null;
  couleur: string;
}

/** Le client généré ne connaît pas encore les fonctions métier : accès non typé maîtrisé. */
const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

export async function chargerMonProfil(): Promise<Soignant> {
  const { data, error } = await rpc("mon_profil");
  if (error) throw new Error(error.message);
  return data as Soignant;
}

export async function creerCabinet(params: {
  nom: string;
  ville?: string;
  code_postal?: string;
  adresse_ligne1?: string;
  telephone?: string;
}): Promise<string> {
  const { data, error } = await rpc("creer_cabinet", {
    p_nom: params.nom,
    p_ville: params.ville ?? null,
    p_code_postal: params.code_postal ?? null,
    p_adresse_ligne1: params.adresse_ligne1 ?? null,
    p_telephone: params.telephone ?? null,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export const profilQueryOptions = {
  queryKey: ["mon-profil"] as const,
  queryFn: chargerMonProfil,
  staleTime: 60_000,
};
