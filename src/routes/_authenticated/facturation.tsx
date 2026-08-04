import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Send, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCabinet } from "@/hooks/use-cabinet";
import { euros } from "@/lib/ngap";
import {
  LIBELLES_STATUT,
  lignesDepuisCotation,
  numeroFacture,
  periodeDe,
  prochaineSequence,
  repartir,
  statutApresPaiement,
  type CotationFacturable,
  type StatutFacture,
} from "@/lib/facturation";

export const Route = createFileRoute("/_authenticated/facturation")({
  head: () => ({
    meta: [
      { title: "Facturation — Cabinet" },
      {
        name: "description",
        content:
          "Des passages cotés aux factures encaissées : part Assurance Maladie, mutuelle, reste à charge et suivi des paiements.",
      },
      { property: "og:title", content: "Facturation — Cabinet" },
      {
        property: "og:description",
        content: "Vos actes cotés deviennent des factures suivies, sans ressaisie.",
      },
    ],
  }),
  component: Facturation,
});

interface Patient {
  id: string;
  nom: string;
  prenom: string;
  ald: boolean;
  exoneration: string | null;
  mutuelle_nom: string | null;
  tiers_payant: boolean;
}

function Facturation() {
  const { cabinetId } = useCabinet();
  const queryClient = useQueryClient();
  const [paiementPour, setPaiementPour] = useState<{
    id: string;
    numero: string;
    reste: number;
    total: number;
    statut: StatutFacture;
    montantPaye: number;
  } | null>(null);
  const [montant, setMontant] = useState("");

  const aFacturer = useQuery({
    queryKey: ["cotations-a-facturer", cabinetId],
    enabled: !!cabinetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cotations")
        .select(
          "id, intervention_id, patient_id, total, lignes, majorations, deplacement, calcule_le, patients(id, nom, prenom, ald, exoneration, mutuelle_nom, tiers_payant)",
        )
        .is("facture_id", null)
        .order("calcule_le", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const factures = useQuery({
    queryKey: ["factures", cabinetId],
    enabled: !!cabinetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factures")
        .select(
          "id, numero, statut, total, montant_paye, part_amo, part_amc, part_patient, periode_debut, periode_fin, patients(nom, prenom)",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const groupes = Object.values(
    (aFacturer.data ?? []).reduce<
      Record<string, { patient: Patient; cotations: CotationFacturable[] }>
    >((acc, c) => {
      const p = c.patients as unknown as Patient | null;
      if (!p) return acc;
      acc[p.id] ??= { patient: p, cotations: [] };
      acc[p.id]!.cotations.push(c as unknown as CotationFacturable);
      return acc;
    }, {}),
  );

  const creerFacture = useMutation({
    mutationFn: async ({
      patient,
      cotations,
    }: {
      patient: Patient;
      cotations: CotationFacturable[];
    }) => {
      if (!cabinetId) throw new Error("Cabinet introuvable");
      const annee = new Date().getFullYear();
      const { data: existantes, error: erreurNum } = await supabase
        .from("factures")
        .select("numero")
        .like("numero", `${annee}-%`);
      if (erreurNum) throw new Error(erreurNum.message);

      const numero = numeroFacture(
        annee,
        prochaineSequence((existantes ?? []).map((f) => f.numero), annee),
      );
      const total = Math.round(cotations.reduce((s, c) => s + Number(c.total), 0) * 100) / 100;
      const part = repartir(total, {
        ald: patient.ald,
        exoneration: patient.exoneration,
        mutuelle: !!patient.mutuelle_nom,
        tiersPayant: patient.tiers_payant,
      });
      const { debut, fin } = periodeDe(cotations);

      const { data: facture, error } = await supabase
        .from("factures")
        .insert({
          cabinet_id: cabinetId,
          patient_id: patient.id,
          numero,
          periode_debut: debut,
          periode_fin: fin,
          statut: "a_envoyer" as const,
          part_amo: part.amo,
          part_amc: part.amc,
          part_patient: part.patient,
          total,
          notes: part.explication,
        })
        .select("id, numero")
        .single();
      if (error) throw new Error(error.message);

      const lignes = cotations.flatMap((c) =>
        lignesDepuisCotation(c).map((l) => ({
          cabinet_id: cabinetId,
          facture_id: facture.id,
          cotation_id: c.id,
          ...l,
        })),
      );
      if (lignes.length > 0) {
        const { error: erreurLignes } = await supabase.from("lignes_facture").insert(lignes);
        if (erreurLignes) throw new Error(erreurLignes.message);
      }

      const { error: erreurLien } = await supabase
        .from("cotations")
        .update({ facture_id: facture.id })
        .in(
          "id",
          cotations.map((c) => c.id),
        );
      if (erreurLien) throw new Error(erreurLien.message);
      return facture.numero;
    },
    onSuccess: (numero) => {
      queryClient.invalidateQueries({ queryKey: ["cotations-a-facturer"] });
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success(`Facture ${numero} créée.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const marquerEnvoyee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("factures")
        .update({ statut: "envoyee" as const, date_envoi: new Date().toISOString().slice(0, 10) })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Facture marquée comme envoyée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const encaisser = useMutation({
    mutationFn: async () => {
      if (!paiementPour || !cabinetId) throw new Error("Facture introuvable");
      const valeur = Number(montant.replace(",", "."));
      if (!Number.isFinite(valeur) || valeur <= 0) throw new Error("Saisissez un montant valide.");

      const { error } = await supabase.from("paiements").insert({
        cabinet_id: cabinetId,
        facture_id: paiementPour.id,
        source: "manuel",
        montant: valeur,
        date_paiement: new Date().toISOString().slice(0, 10),
      });
      if (error) throw new Error(error.message);

      const cumul = Math.round((paiementPour.montantPaye + valeur) * 100) / 100;
      const statut = statutApresPaiement(paiementPour.total, cumul, paiementPour.statut);
      const { error: erreurMaj } = await supabase
        .from("factures")
        .update({
          montant_paye: cumul,
          statut,
          date_paiement:
            statut === "payee" ? new Date().toISOString().slice(0, 10) : null,
        })
        .eq("id", paiementPour.id);
      if (erreurMaj) throw new Error(erreurMaj.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Paiement enregistré.");
      setPaiementPour(null);
      setMontant("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const encours = (factures.data ?? []).reduce(
    (s, f) => s + (Number(f.total) - Number(f.montant_paye)),
    0,
  );

  return (
    <AppShell
      titre="Facturation"
      sousTitre="Les passages cotés deviennent des factures suivies, sans ressaisie."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Indicateur
          titre="En attente de facturation"
          valeur={euros(
            groupes.reduce((s, g) => s + g.cotations.reduce((t, c) => t + Number(c.total), 0), 0),
          )}
        />
        <Indicateur titre="Restant à encaisser" valeur={euros(encours)} />
        <Indicateur titre="Factures émises" valeur={String(factures.data?.length ?? 0)} />
      </div>

      <section className="carte-clinique mb-6 p-5">
        <h2 className="font-display text-lg font-semibold">Passages cotés à facturer</h2>
        {aFacturer.isLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">Chargement…</p>
        ) : groupes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Rien à facturer : clôturez des passages depuis la tournée pour générer des cotations.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {groupes.map(({ patient, cotations }) => {
              const total =
                Math.round(cotations.reduce((s, c) => s + Number(c.total), 0) * 100) / 100;
              const part = repartir(total, {
                ald: patient.ald,
                exoneration: patient.exoneration,
                mutuelle: !!patient.mutuelle_nom,
              });
              return (
                <li
                  key={patient.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {patient.prenom} {patient.nom}
                    </p>
                    <p className="chiffres-tabulaires text-xs text-muted-foreground">
                      {cotations.length} passage(s) · AMO {euros(part.amo)} · Mutuelle{" "}
                      {euros(part.amc)} · Patient {euros(part.patient)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="chiffres-tabulaires font-display text-lg font-semibold">
                      {euros(total)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => creerFacture.mutate({ patient, cotations })}
                      disabled={creerFacture.isPending}
                    >
                      <FileText className="size-4" />
                      Facturer
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="carte-clinique p-5">
        <h2 className="font-display text-lg font-semibold">Factures</h2>
        {factures.isLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">Chargement…</p>
        ) : (factures.data?.length ?? 0) === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aucune facture émise pour l'instant.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {factures.data!.map((f) => {
              const reste = Math.round((Number(f.total) - Number(f.montant_paye)) * 100) / 100;
              const p = f.patients as { nom: string; prenom: string } | null;
              return (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="chiffres-tabulaires font-medium">{f.numero}</span>
                      <Badge variant="secondary">
                        {LIBELLES_STATUT[f.statut as StatutFacture] ?? f.statut}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {p ? `${p.prenom} ${p.nom} · ` : ""}
                      {f.periode_debut} → {f.periode_fin}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="chiffres-tabulaires font-display text-lg font-semibold">
                        {euros(Number(f.total))}
                      </p>
                      <p className="chiffres-tabulaires text-xs text-muted-foreground">
                        Reste {euros(reste)}
                      </p>
                    </div>
                    {f.statut === "a_envoyer" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => marquerEnvoyee.mutate(f.id)}
                      >
                        <Send className="size-4" />
                        Envoyée
                      </Button>
                    ) : null}
                    {reste > 0 ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setPaiementPour({
                            id: f.id,
                            numero: f.numero,
                            reste,
                            total: Number(f.total),
                            statut: f.statut as StatutFacture,
                            montantPaye: Number(f.montant_paye),
                          });
                          setMontant(String(reste));
                        }}
                      >
                        <Wallet className="size-4" />
                        Encaisser
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog open={!!paiementPour} onOpenChange={(o) => !o && setPaiementPour(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Encaisser la facture {paiementPour?.numero}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="montant">Montant reçu (€)</Label>
            <Input
              id="montant"
              inputMode="decimal"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Reste dû : {euros(paiementPour?.reste ?? 0)}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPaiementPour(null)}>
              Annuler
            </Button>
            <Button onClick={() => encaisser.mutate()} disabled={encaisser.isPending}>
              Enregistrer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Indicateur({ titre, valeur }: { titre: string; valeur: string }) {
  return (
    <div className="carte-clinique p-4">
      <p className="text-sm text-muted-foreground">{titre}</p>
      <p className="chiffres-tabulaires mt-1 font-display text-2xl font-semibold">{valeur}</p>
    </div>
  );
}
