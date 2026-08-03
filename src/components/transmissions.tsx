import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useCabinet } from "@/hooks/use-cabinet";
import { cn } from "@/lib/utils";

const GRAVITES = [
  { valeur: "info", label: "Observation" },
  { valeur: "attention", label: "À surveiller" },
  { valeur: "urgent", label: "Urgent" },
] as const;

type Gravite = (typeof GRAVITES)[number]["valeur"];

const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

/** Transmissions du dossier : journal horodaté, non modifiable, comme au chevet. */
export function Transmissions({ patientId }: { patientId: string }) {
  const { cabinetId, profil } = useCabinet();
  const queryClient = useQueryClient();
  const [texte, setTexte] = useState("");
  const [gravite, setGravite] = useState<Gravite>("info");

  const liste = useQuery({
    queryKey: ["transmissions", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transmissions")
        .select("id, texte, gravite, type, created_at, soignants:auteur_id(nom, prenom)")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const ajout = useMutation({
    mutationFn: async () => {
      if (!cabinetId) throw new Error("Cabinet introuvable");
      const contenu = texte.trim();
      if (contenu.length < 3) throw new Error("Écrivez au moins quelques mots.");
      if (contenu.length > 4000) throw new Error("Transmission trop longue (4000 caractères max).");
      const { error } = await supabase.from("transmissions").insert({
        cabinet_id: cabinetId,
        patient_id: patientId,
        auteur_id: profil?.id ?? null,
        type: gravite === "info" ? "observation" : "alerte",
        gravite,
        texte: contenu,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transmissions", patientId] });
      setTexte("");
      setGravite("info");
      toast.success("Transmission enregistrée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="carte-clinique p-5 md:col-span-2">
      <h2 className="font-display text-lg font-semibold">Transmissions</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Une transmission est définitive : elle horodate ce que vous avez constaté.
      </p>

      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="transmission">Nouvelle transmission</Label>
          <Textarea
            id="transmission"
            rows={3}
            value={texte}
            maxLength={4000}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Plaie propre, pas d'écoulement. Patiente fatiguée ce matin."
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {GRAVITES.map((g) => (
              <button
                key={g.valeur}
                type="button"
                onClick={() => setGravite(g.valeur)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  gravite === g.valeur
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
          <Button onClick={() => ajout.mutate()} disabled={ajout.isPending}>
            {ajout.isPending ? "Enregistrement…" : "Transmettre"}
          </Button>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {liste.isLoading ? (
          <li className="text-sm text-muted-foreground">Chargement…</li>
        ) : (liste.data?.length ?? 0) === 0 ? (
          <li className="text-sm text-muted-foreground">Aucune transmission pour l'instant.</li>
        ) : (
          liste.data!.map((t) => (
            <li key={t.id} className="rounded-lg border border-border/70 p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={t.gravite === "urgent" ? "destructive" : "secondary"}>
                  {GRAVITES.find((g) => g.valeur === t.gravite)?.label ?? t.gravite}
                </Badge>
                <span>{dateFr.format(new Date(t.created_at))}</span>
                {t.soignants ? (
                  <span>
                    · {t.soignants.prenom} {t.soignants.nom}
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm">{t.texte}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
