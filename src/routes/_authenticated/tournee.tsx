import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, CircleDot, Clock, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useCabinet } from "@/hooks/use-cabinet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tournee")({
  head: () => ({
    meta: [
      { title: "Tournée du jour — Cabinet" },
      {
        name: "description",
        content:
          "Le déroulé de votre journée, passage par passage : horaires, adresses, actes prévus et pointage en un geste.",
      },
      { property: "og:title", content: "Tournée du jour — Cabinet" },
      {
        property: "og:description",
        content: "Le déroulé de votre journée de soins, passage par passage.",
      },
    ],
  }),
  component: Tournee,
});

const STATUTS: Record<string, { label: string; classe: string }> = {
  planifie: { label: "Prévu", classe: "bg-muted text-muted-foreground" },
  en_route: { label: "En route", classe: "bg-accent text-accent-foreground" },
  en_cours: { label: "En cours", classe: "bg-primary text-primary-foreground" },
  realise: { label: "Réalisé", classe: "bg-success text-success-foreground" },
  absent: { label: "Absent", classe: "bg-warning text-warning-foreground" },
  refuse: { label: "Refusé", classe: "bg-warning text-warning-foreground" },
  annule: { label: "Annulé", classe: "bg-muted text-muted-foreground" },
  a_replanifier: { label: "À replanifier", classe: "bg-destructive text-destructive-foreground" },
};

type Periode = "matin" | "soir" | "nuit" | "journee";

function Tournee() {
  const { cabinetId, profil } = useCabinet();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const interventions = useQuery({
    queryKey: ["interventions", date, cabinetId],
    enabled: !!cabinetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interventions")
        .select(
          "id, date, periode, debut_prevu, fin_prevue, statut, ordre, notes, plan_id, patients(id, nom, prenom, adresse_ligne1, code_postal, ville, acces_etage, acces_code)",
        )
        .eq("date", date)
        .order("debut_prevu", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const generer = useMutation({
    mutationFn: async () => {
      if (!cabinetId) throw new Error("Cabinet introuvable");
      const jour = new Date(`${date}T12:00:00`).getDay();

      const { data: plans, error } = await supabase
        .from("plans_de_soins")
        .select("id, patient_id, periodes, jours_semaine, heure_cible, duree_minutes, date_debut, date_fin, actif")
        .eq("actif", true)
        .lte("date_debut", date);
      if (error) throw error;

      const eligibles = (plans ?? []).filter(
        (p) =>
          (!p.date_fin || p.date_fin >= date) &&
          (p.jours_semaine.length === 0 || p.jours_semaine.includes(jour)),
      );

      const { data: existantes } = await supabase
        .from("interventions")
        .select("plan_id, periode")
        .eq("date", date);
      const deja = new Set((existantes ?? []).map((i) => `${i.plan_id}|${i.periode}`));

      const lignes = eligibles.flatMap((p) =>
        (p.periodes.length > 0 ? p.periodes : (["matin"] as Periode[])).flatMap((periode) => {
          if (deja.has(`${p.id}|${periode}`)) return [];
          const heure =
            p.heure_cible ??
            (periode === "matin" ? "07:30:00" : periode === "soir" ? "18:00:00" : "12:00:00");
          const debut = new Date(`${date}T${heure}`);
          const fin = new Date(debut.getTime() + (p.duree_minutes ?? 15) * 60_000);
          return [
            {
              cabinet_id: cabinetId,
              patient_id: p.patient_id,
              plan_id: p.id,
              soignant_id: profil?.id ?? null,
              date,
              periode,
              debut_prevu: debut.toISOString(),
              fin_prevue: fin.toISOString(),
              statut: "planifie" as const,
            },
          ];
        }),
      );

      if (lignes.length === 0) return 0;
      const { error: insErr } = await supabase.from("interventions").insert(lignes);
      if (insErr) throw insErr;
      return lignes.length;
    },
    onSuccess: (n) => {
      queryClient.invalidateQueries({ queryKey: ["interventions"] });
      toast.success(
        n === 0 ? "Tournée déjà à jour, aucun passage à ajouter." : `${n} passage(s) ajouté(s).`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changerStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const patch: Record<string, unknown> = { statut };
      if (statut === "en_cours") patch["debut_reel"] = new Date().toISOString();
      if (statut === "realise") patch["fin_reelle"] = new Date().toISOString();
      const { error } = await supabase
        .from("interventions")
        .update(patch as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interventions"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const liste = interventions.data ?? [];
  const faits = liste.filter((i) => i.statut === "realise").length;

  return (
    <AppShell
      titre="Tournée"
      sousTitre={format(new Date(`${date}T12:00:00`), "EEEE d MMMM yyyy", { locale: fr })}
      action={
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
          <Button
            variant="secondary"
            onClick={() => generer.mutate()}
            disabled={generer.isPending || !cabinetId}
          >
            <Sparkles className="size-4" />
            Générer
          </Button>
        </div>
      }
    >
      <div className="carte-clinique mb-6 flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">Passages du jour</p>
          <p className="chiffres-tabulaires font-display text-2xl font-semibold">
            {faits} / {liste.length}
          </p>
        </div>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${liste.length ? (faits / liste.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {interventions.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement de la tournée…</p>
      ) : liste.length === 0 ? (
        <div className="carte-clinique p-8 text-center">
          <p className="font-display text-lg font-semibold">Aucun passage prévu</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Créez un patient et son plan de soins, puis utilisez « Générer » pour construire la
            tournée automatiquement.
          </p>
          <Button asChild className="mt-4">
            <Link to="/patients">Voir mes patients</Link>
          </Button>
        </div>
      ) : (
        <ol className="space-y-3">
          {liste.map((i) => {
            const p = i.patients;
            const statut = STATUTS[i.statut] ?? STATUTS["planifie"]!;
            return (
              <li key={i.id} className="carte-clinique p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-muted-foreground" />
                      <span className="chiffres-tabulaires font-medium">
                        {format(new Date(i.debut_prevu), "HH:mm")}
                      </span>
                      <Badge className={cn("border-transparent", statut.classe)}>
                        {statut.label}
                      </Badge>
                    </div>
                    <p className="mt-2 font-display text-lg font-semibold">
                      {p ? `${p.prenom} ${p.nom}` : "Patient"}
                    </p>
                    {p ? (
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 size-3.5 shrink-0" />
                        <span>
                          {p.adresse_ligne1}, {p.code_postal} {p.ville}
                          {p.acces_etage ? ` — étage ${p.acces_etage}` : ""}
                          {p.acces_code ? ` — code ${p.acces_code}` : ""}
                        </span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {i.statut !== "realise" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => changerStatut.mutate({ id: i.id, statut: "en_cours" })}
                        >
                          <CircleDot className="size-4" />
                          Démarrer
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            setACloturer({
                              id: i.id,
                              patient_id: i.patients?.id ?? "",
                              plan_id: i.plan_id,
                              debut_prevu: i.debut_prevu,
                              patient: p ? `${p.prenom} ${p.nom}` : undefined,
                            })
                          }
                        >
                          <CheckCircle2 className="size-4" />
                          Terminer
                        </Button>

                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => changerStatut.mutate({ id: i.id, statut: "planifie" })}
                      >
                        Annuler le pointage
                      </Button>
                    )}
                  </div>
                </div>
                {p ? (
                  <Link
                    to="/patients/$patientId"
                    params={{ patientId: p.id }}
                    className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Ouvrir le dossier
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </AppShell>
  );
}
