import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SelecteurActes } from "@/components/selecteur-actes";
import { supabase } from "@/integrations/supabase/client";
import { useCabinet } from "@/hooks/use-cabinet";
import { type ActeCatalogue, versActeACoter } from "@/lib/catalogue";
import { calculerCotation, euros, type ContexteCotation } from "@/lib/ngap";

export interface InterventionAClore {
  id: string;
  patient_id: string;
  plan_id: string | null;
  debut_prevu: string;
  patient?: string;
}

interface Selection extends ActeCatalogue {
  quantite: number;
}

const CHAMPS_ACTE =
  "id, code, libelle, chapitre, lettre_cle, coefficient, duree_minutes, prescription_obligatoire, bsi_requis, conditions";

/**
 * Clôture d'un passage : les actes prévus sont déjà là, l'infirmière confirme,
 * la cotation NGAP est calculée, justifiée et archivée avec l'intervention.
 */
export function ClotureIntervention({
  intervention,
  onOuvertChange,
}: {
  intervention: InterventionAClore | null;
  onOuvertChange: (ouvert: boolean) => void;
}) {
  const { cabinetId, profil } = useCabinet();
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<Selection[]>([]);
  const [notes, setNotes] = useState("");
  const [contexte, setContexte] = useState<ContexteCotation>({ aDomicile: true, distanceKm: 0 });

  const heurePassage = intervention
    ? new Date(intervention.debut_prevu).toISOString().slice(11, 16)
    : "08:00";

  const actesPrevus = useQuery({
    queryKey: ["plan-actes", intervention?.plan_id],
    enabled: !!intervention?.plan_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_soins_actes")
        .select(`quantite, catalogue_actes(${CHAMPS_ACTE})`)
        .eq("plan_id", intervention!.plan_id!);
      if (error) throw new Error(error.message);
      return (data ?? [])
        .filter((r) => r.catalogue_actes)
        .map((r) => ({
          ...(r.catalogue_actes as unknown as ActeCatalogue),
          quantite: r.quantite ?? 1,
        }));
    },
  });

  const patient = useQuery({
    queryKey: ["patient-cotation", intervention?.patient_id],
    enabled: !!intervention?.patient_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("date_naissance, ald, hors_zone")
        .eq("id", intervention!.patient_id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // Pré-remplissage : les actes du plan, le contexte du passage.
  useEffect(() => {
    if (!intervention) return;
    const debut = new Date(intervention.debut_prevu);
    const naissance = patient.data?.date_naissance ? new Date(patient.data.date_naissance) : null;
    const ageAns = naissance
      ? (debut.getTime() - naissance.getTime()) / (365.25 * 24 * 3600 * 1000)
      : 99;
    setContexte((c) => ({
      ...c,
      aDomicile: true,
      heure: debut.toTimeString().slice(0, 5),
      dimancheOuFerie: debut.getDay() === 0,
      jeuneEnfant: ageAns < 7,
    }));
  }, [intervention, patient.data]);

  useEffect(() => {
    if (actesPrevus.data) setSelection(actesPrevus.data);
  }, [actesPrevus.data]);

  const resultat = useMemo(
    () => calculerCotation(selection.map((a) => versActeACoter(a, a.quantite)), contexte),
    [selection, contexte],
  );

  const enregistrer = useMutation({
    mutationFn: async () => {
      if (!intervention) throw new Error("Passage introuvable");
      if (!cabinetId) throw new Error("Cabinet introuvable");
      if (selection.length === 0) throw new Error("Confirmez au moins un acte réalisé.");

      await supabase.from("actes_realises").delete().eq("intervention_id", intervention.id);
      const { error: erreurActes } = await supabase.from("actes_realises").insert(
        selection.map((a) => ({
          cabinet_id: cabinetId,
          intervention_id: intervention.id,
          acte_id: a.id,
          quantite: a.quantite,
          realise_par: profil?.id ?? null,
          observations: notes.trim() || null,
        })),
      );
      if (erreurActes) throw new Error(erreurActes.message);

      await supabase
        .from("cotations")
        .delete()
        .eq("intervention_id", intervention.id)
        .is("facture_id", null);

      const { error: erreurCotation } = await supabase.from("cotations").insert({
        cabinet_id: cabinetId,
        intervention_id: intervention.id,
        patient_id: intervention.patient_id,
        lignes: resultat.lignes as never,
        majorations: resultat.majorations as never,
        deplacement: resultat.deplacement as never,
        total_ht: resultat.totalActes,
        total: resultat.total,
        justification: resultat.justification as never,
        alertes: resultat.alertes as never,
        version_ngap: "2026",
      });
      if (erreurCotation) throw new Error(erreurCotation.message);

      const { error: erreurMaj } = await supabase
        .from("interventions")
        .update({
          statut: "realise",
          fin_reelle: new Date().toISOString(),
          notes: notes.trim() || null,
        })
        .eq("id", intervention.id);
      if (erreurMaj) throw new Error(erreurMaj.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interventions"] });
      queryClient.invalidateQueries({ queryKey: ["cotations-a-facturer"] });
      toast.success(`Passage clôturé — ${euros(resultat.total)} cotés.`);
      onOuvertChange(false);
      setSelection([]);
      setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function ajouter(acte: ActeCatalogue) {
    setSelection((s) =>
      s.some((x) => x.id === acte.id)
        ? s.map((x) => (x.id === acte.id ? { ...x, quantite: x.quantite + 1 } : x))
        : [...s, { ...acte, quantite: 1 }],
    );
  }

  return (
    <Dialog open={!!intervention} onOpenChange={onOuvertChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Clôturer le passage {heurePassage}</DialogTitle>
          <DialogDescription>
            {intervention?.patient ? `${intervention.patient} — ` : ""}confirmez les actes réalisés,
            la cotation se calcule et s'archive avec le passage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section>
            <Label>Actes réalisés</Label>
            {selection.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Aucun acte prévu au plan : ajoutez-les depuis le catalogue ci-dessous.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {selection.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{a.libelle}</p>
                      <p className="chiffres-tabulaires mt-0.5 text-xs text-muted-foreground">
                        {a.lettre_cle} {Number(a.coefficient)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Retirer une unité"
                        onClick={() =>
                          setSelection((s) =>
                            s
                              .map((x) =>
                                x.id === a.id ? { ...x, quantite: x.quantite - 1 } : x,
                              )
                              .filter((x) => x.quantite > 0),
                          )
                        }
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="chiffres-tabulaires w-6 text-center text-sm font-semibold">
                        {a.quantite}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Ajouter une unité"
                        onClick={() => ajouter(a)}
                      >
                        <Plus className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Supprimer l'acte"
                        onClick={() => setSelection((s) => s.filter((x) => x.id !== a.id))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <SelecteurActes onAjouter={ajouter} placeholder="Ajouter un acte non prévu…" />
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <Bascule
              id="cloture-domicile"
              label="Au domicile"
              valeur={contexte.aDomicile}
              onChange={(v) => setContexte((c) => ({ ...c, aDomicile: v }))}
            />
            <Bascule
              id="cloture-mci"
              label="Coordination infirmière (MCI)"
              valeur={!!contexte.coordinationInfirmiere}
              onChange={(v) => setContexte((c) => ({ ...c, coordinationInfirmiere: v }))}
            />
            <Bascule
              id="cloture-dimanche"
              label="Dimanche ou férié"
              valeur={!!contexte.dimancheOuFerie}
              onChange={(v) => setContexte((c) => ({ ...c, dimancheOuFerie: v }))}
            />
            <div className="space-y-1.5">
              <Label htmlFor="cloture-km">Distance aller (km)</Label>
              <Input
                id="cloture-km"
                type="number"
                min={0}
                step="0.5"
                value={contexte.distanceKm ?? 0}
                onChange={(e) =>
                  setContexte((c) => ({ ...c, distanceKm: Number(e.target.value) }))
                }
              />
            </div>
          </section>

          <section className="space-y-1.5">
            <Label htmlFor="cloture-notes">Observation du passage (optionnelle)</Label>
            <Textarea
              id="cloture-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Plaie propre, pas de douleur, prochain pansement à J+2."
            />
          </section>

          <section className="rounded-xl bg-primary p-4 text-primary-foreground">
            <p className="text-sm opacity-90">Cotation du passage</p>
            <p className="chiffres-tabulaires font-display text-3xl font-semibold">
              {euros(resultat.total)}
            </p>
            <p className="mt-1 text-xs opacity-80">
              Actes {euros(resultat.totalActes)} · Majorations {euros(resultat.totalMajorations)} ·
              Déplacement {euros(resultat.totalDeplacement)}
            </p>
          </section>

          {resultat.alertes.length > 0 ? (
            <ul className="space-y-1 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              {resultat.alertes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOuvertChange(false)}>
            Annuler
          </Button>
          <Button onClick={() => enregistrer.mutate()} disabled={enregistrer.isPending}>
            Clôturer et coter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Bascule({
  id,
  label,
  valeur,
  onChange,
}: {
  id: string;
  label: string;
  valeur: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Switch id={id} checked={valeur} onCheckedChange={onChange} />
    </div>
  );
}
