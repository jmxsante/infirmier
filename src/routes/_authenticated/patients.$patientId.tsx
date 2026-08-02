import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/patients/$patientId")({
  head: () => ({
    meta: [
      { title: "Dossier patient — Cabinet" },
      {
        name: "description",
        content: "Coordonnées, accès au domicile, plan de soins et transmissions du patient.",
      },
      { property: "og:title", content: "Dossier patient — Cabinet" },
      { property: "og:description", content: "Le dossier complet du patient, à jour." },
    ],
  }),
  component: Dossier,
});

function Dossier() {
  const { patientId } = Route.useParams();

  const patient = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const p = patient.data;

  return (
    <AppShell titre={p ? `${p.prenom} ${p.nom}` : "Dossier"} sousTitre="Dossier patient">
      <Link
        to="/patients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux patients
      </Link>

      {patient.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement du dossier…</p>
      ) : !p ? (
        <p className="text-sm text-muted-foreground">Dossier introuvable.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="carte-clinique p-5">
            <h2 className="font-display text-lg font-semibold">Identité</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Ligne label="Né(e) le" valeur={p.date_naissance} />
              <Ligne label="Téléphone" valeur={p.telephone} />
              <Ligne label="Statut du dossier" valeur={p.statut} />
              <Ligne label="ALD" valeur={p.ald ? "Oui" : "Non"} />
            </dl>
          </section>

          <section className="carte-clinique p-5">
            <h2 className="font-display text-lg font-semibold">Accès au domicile</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Ligne label="Adresse" valeur={`${p.adresse_ligne1}, ${p.code_postal} ${p.ville}`} />
              <Ligne label="Étage" valeur={p.acces_etage} />
              <Ligne label="Code" valeur={p.acces_code} />
              <Ligne label="Stationnement" valeur={p.acces_stationnement} />
            </dl>
          </section>

          <section className="carte-clinique p-5 md:col-span-2">
            <h2 className="font-display text-lg font-semibold">Éléments cliniques</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Ligne label="Allergies" valeur={p.allergies} />
              <Ligne label="Antécédents" valeur={p.antecedents} />
              <Ligne label="Traitements en cours" valeur={p.traitements_en_cours} />
              <Ligne label="Observations" valeur={p.observations} />
            </dl>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function Ligne({ label, valeur }: { label: string; valeur?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{valeur || "—"}</dd>
    </div>
  );
}
