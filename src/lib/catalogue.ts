import { supabase } from "@/integrations/supabase/client";
import type { ActeACoter, LettreCle } from "@/lib/ngap";

export interface ActeCatalogue {
  id: string;
  code: string;
  libelle: string;
  chapitre: string | null;
  lettre_cle: string;
  coefficient: number;
  duree_minutes: number;
  prescription_obligatoire: boolean;
  bsi_requis: boolean;
  conditions: string | null;
}

const LETTRES: LettreCle[] = ["AMI", "AIS", "AMX", "BSA", "BSB", "BSC", "DI"];

export function versLettreCle(valeur: string): LettreCle {
  return (LETTRES as string[]).includes(valeur) ? (valeur as LettreCle) : "AUTRE";
}

export function versActeACoter(a: ActeCatalogue, quantite = 1): ActeACoter {
  return {
    id: a.id,
    code: a.code,
    libelle: a.libelle,
    lettreCle: versLettreCle(a.lettre_cle),
    coefficient: Number(a.coefficient),
    quantite,
  };
}

const CHAMPS =
  "id, code, libelle, chapitre, lettre_cle, coefficient, duree_minutes, prescription_obligatoire, bsi_requis, conditions";

/** Recherche plein-texte simple dans le catalogue officiel (actes actifs uniquement). */
export function catalogueQueryOptions(recherche: string) {
  const terme = recherche.trim();
  return {
    queryKey: ["catalogue-actes", terme] as const,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ActeCatalogue[]> => {
      let requete = supabase
        .from("catalogue_actes")
        .select(CHAMPS)
        .eq("actif", true)
        .order("chapitre", { ascending: true })
        .order("coefficient", { ascending: true })
        .limit(terme ? 40 : 25);
      if (terme) {
        const motif = `%${terme.replace(/[%,]/g, " ")}%`;
        requete = requete.or(`libelle.ilike.${motif},code.ilike.${motif},chapitre.ilike.${motif}`);
      }
      const { data, error } = await requete;
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ActeCatalogue[];
    },
  };
}

export function actesParIdsQueryOptions(ids: string[]) {
  return {
    queryKey: ["catalogue-actes-ids", [...ids].sort()] as const,
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ActeCatalogue[]> => {
      const { data, error } = await supabase.from("catalogue_actes").select(CHAMPS).in("id", ids);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ActeCatalogue[];
    },
  };
}
