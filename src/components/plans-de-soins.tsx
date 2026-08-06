import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarDays, FileCheck2, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelecteurActes } from "@/components/selecteur-actes";
import { supabase } from "@/integrations/supabase/client";
import { useCabinet } from "@/hooks/use-cabinet";
import { type ActeCatalogue, versActeACoter } from "@/lib/catalogue";
import { calculerCotation, euros } from "@/lib/ngap";
import { couvreLaPeriode, statutEffectif, type StatutOrdonnance } from "@/lib/ordonnances";
import { cn } from "@/lib/utils";

const JOURS = [
  { valeur: 1, court: "L" },
  { valeur: 2, court: "M" },
  { valeur: 3, court: "Me" },
  { valeur: 4, court: "J" },
  { valeur: 5, court: "V" },
  { valeur: 6, court: "S" },
  { valeur: 0, court: "D" },
];

const PERIODES = [
  { valeur: "matin", label: "Matin" },
  { valeur: "soir", label: "Soir" },
  { valeur: "journee", label: "Journée" },
  { valeur: "nuit", label: "Nuit" },
] as const;

type Periode = (typeof PERIODES)[number]["valeur"];

/** Plans de soins d'un patient : la source de vérité qui alimente la tournée. */
export function PlansDeSoins({ patientId }: { patientId: string }) {
  const { cabinetId } = useCabinet();
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(false);

  const [libelle, setLibelle] = useState("");
  const [dateDebut, setDateDebut] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateFin, setDateFin] = useState("");
  const [jours, setJours] = useState<number[]>([1, 2, 3, 4, 5]);
  const [periodes, setPeriodes] = useState<Periode[]>(["matin"]);
  const [heure, setHeure] = useState("07:30");
  const [duree, setDuree] = useState(15);
  const [protocole, setProtocole] = useState("");
  const [actes, setActes] = useState<(ActeCatalogue & { quantite: number })[]>([]);
  const [ordonnanceId, setOrdonnanceId] = useState<string>("aucune");

  const plans = useQuery({
    queryKey: ["plans-de-soins", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans_de_soins")
        .select(
          "id, libelle, date_debut, date_fin, jours_semaine, periodes, heure_cible, duree_minutes, protocole, actif, ordonnance_id, ordonnances:ordonnance_id(id, statut, date_debut, date_fin, date_prescription, fichier_path), plan_soins_actes(id, quantite, catalogue_actes(id, code, libelle, lettre_cle, coefficient))",
        )
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const ordonnances = useQuery({
    queryKey: ["ordonnances-liables", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordonnances")
        .select("id, statut, date_prescription, date_debut, date_fin, fichier_path")
        .eq("patient_id", patientId)
        .order("date_prescription", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const ordonnanceChoisie = (ordonnances.data ?? []).find((o) => o.id === ordonnanceId) ?? null;
  const couverture = ordonnanceChoisie
    ? couvreLaPeriode(
        { ...ordonnanceChoisie, statut: ordonnanceChoisie.statut as StatutOrdonnance },
        dateDebut,
        dateFin || null,
      )
    : null;

  function reinitialiser() {
    setLibelle("");
    setDateFin("");
    setJours([1, 2, 3, 4, 5]);
    setPeriodes(["matin"]);
    setHeure("07:30");
    setDuree(15);
    setProtocole("");
    setActes([]);
    setOrdonnanceId("aucune");
  }


  const creation = useMutation({
    mutationFn: async () => {
      if (!cabinetId) throw new Error("Cabinet introuvable");
      if (actes.length === 0) throw new Error("Ajoutez au moins un acte au plan de soins.");
      const { data, error } = await supabase
        .from("plans_de_soins")
        .insert({
          cabinet_id: cabinetId,
          patient_id: patientId,
          ordonnance_id: ordonnanceId === "aucune" ? null : ordonnanceId,
          libelle: libelle.trim() || "Plan de soins",
          date_debut: dateDebut,
          date_fin: dateFin || null,
          jours_semaine: jours,
          periodes,
          heure_cible: heure ? `${heure}:00` : null,
          duree_minutes: duree,
          protocole: protocole.trim() || null,
          actif: true,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      const { error: erreurActes } = await supabase.from("plan_soins_actes").insert(
        actes.map((a) => ({
          cabinet_id: cabinetId,
          plan_id: data.id,
          acte_id: a.id,
          quantite: a.quantite,
        })),
      );
      if (erreurActes) throw new Error(erreurActes.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans-de-soins", patientId] });
      toast.success("Plan de soins enregistré. Il alimentera la tournée.");
      setOuvert(false);
      reinitialiser();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const basculer = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { error } = await supabase.from("plans_de_soins").update({ actif }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans-de-soins", patientId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const apercu = calculerCotation(
    actes.map((a) => versActeACoter(a, a.quantite)),
    { aDomicile: true, heure },
  );

  return (
    <section className="carte-clinique p-5 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Plans de soins</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Le rythme des passages et les actes à réaliser. C'est ce qui construit la tournée.
          </p>
        </div>

        <Dialog open={ouvert} onOpenChange={setOuvert}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Nouveau plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau plan de soins</DialogTitle>
              <DialogDescription>
                Trois minutes suffisent : le rythme, les actes, c'est tout.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="libelle">Intitulé</Label>
                <Input
                  id="libelle"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  placeholder="Pansement post-opératoire"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="debut">Début</Label>
                  <Input
                    id="debut"
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fin">Fin (optionnelle)</Label>
                  <Input
                    id="fin"
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ordonnance">Ordonnance qui autorise ces soins</Label>
                <Select value={ordonnanceId} onValueChange={setOrdonnanceId}>
                  <SelectTrigger id="ordonnance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aucune">Aucune (soins sans prescription)</SelectItem>
                    {(ordonnances.data ?? []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {`Du ${o.date_prescription}`}
                        {o.date_fin ? ` → ${o.date_fin}` : " (sans échéance)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {couverture === false ? (
                  <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    Cette ordonnance ne couvre pas toute la période du plan : les passages hors
                    couverture ne seront pas facturables.
                  </p>
                ) : couverture === true ? (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <FileCheck2 className="size-4" />
                    Période entièrement couverte par l'ordonnance.
                  </p>
                ) : null}
              </div>



              <div>
                <Label>Jours de passage</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {JOURS.map((j) => {
                    const actif = jours.includes(j.valeur);
                    return (
                      <button
                        key={j.valeur}
                        type="button"
                        onClick={() =>
                          setJours((s) =>
                            actif ? s.filter((x) => x !== j.valeur) : [...s, j.valeur],
                          )
                        }
                        className={cn(
                          "size-11 rounded-full border text-sm font-semibold transition-colors",
                          actif
                            ? "border-transparent bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {j.court}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Moments de la journée</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PERIODES.map((p) => {
                    const actif = periodes.includes(p.valeur);
                    return (
                      <button
                        key={p.valeur}
                        type="button"
                        onClick={() =>
                          setPeriodes((s) =>
                            actif ? s.filter((x) => x !== p.valeur) : [...s, p.valeur],
                          )
                        }
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          actif
                            ? "border-transparent bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="heure">Heure cible</Label>
                  <Input
                    id="heure"
                    type="time"
                    value={heure}
                    onChange={(e) => setHeure(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duree">Durée (min)</Label>
                  <Input
                    id="duree"
                    type="number"
                    min={5}
                    step={5}
                    value={duree}
                    onChange={(e) => setDuree(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label>Actes à réaliser</Label>
                {actes.length > 0 ? (
                  <ul className="mb-3 mt-2 space-y-2">
                    {actes.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-2.5"
                      >
                        <span className="min-w-0 text-sm">
                          <span className="chiffres-tabulaires font-semibold">
                            {a.quantite}× {a.lettre_cle} {Number(a.coefficient)}
                          </span>{" "}
                          — {a.libelle}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Retirer l'acte"
                          onClick={() => setActes((s) => s.filter((x) => x.id !== a.id))}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-2">
                  <SelecteurActes
                    onAjouter={(acte) =>
                      setActes((s) =>
                        s.some((x) => x.id === acte.id)
                          ? s.map((x) =>
                              x.id === acte.id ? { ...x, quantite: x.quantite + 1 } : x,
                            )
                          : [...s, { ...acte, quantite: 1 }],
                      )
                    }
                  />
                </div>
              </div>

              {actes.length > 0 ? (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  Cotation estimée par passage au domicile :{" "}
                  <span className="chiffres-tabulaires font-semibold">{euros(apercu.total)}</span>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="protocole">Protocole / consignes</Label>
                <Textarea
                  id="protocole"
                  rows={3}
                  value={protocole}
                  onChange={(e) => setProtocole(e.target.value)}
                  placeholder="Réfection à sec, surveiller la rougeur péri-cicatricielle…"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => creation.mutate()}
                disabled={creation.isPending}
                className="w-full"
              >
                {creation.isPending ? "Enregistrement…" : "Enregistrer le plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {plans.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement des plans…</p>
      ) : (plans.data?.length ?? 0) === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Aucun plan de soins. Créez-en un pour que les passages apparaissent automatiquement dans la
          tournée.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {plans.data!.map((p) => (
            <li key={p.id} className="rounded-lg border border-border/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{p.libelle}</p>
                    <Badge variant={p.actif ? "default" : "secondary"}>
                      {p.actif ? "Actif" : "Suspendu"}
                    </Badge>
                    <BadgeOrdonnance plan={p} />
                  </div>

                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {p.jours_semaine.length === 7 || p.jours_semaine.length === 0
                      ? "Tous les jours"
                      : p.jours_semaine
                          .map((j: number) => JOURS.find((x) => x.valeur === j)?.court ?? j)
                          .join(" · ")}
                    {" — "}
                    {p.periodes.join(", ")} · {String(p.heure_cible ?? "").slice(0, 5)} ·{" "}
                    {p.duree_minutes} min
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(p.plan_soins_actes ?? []).map((pa) => (
                      <li key={pa.id} className="text-muted-foreground">
                        <span className="chiffres-tabulaires font-medium text-foreground">
                          {pa.quantite}× {pa.catalogue_actes?.lettre_cle}{" "}
                          {Number(pa.catalogue_actes?.coefficient ?? 0)}
                        </span>{" "}
                        — {pa.catalogue_actes?.libelle}
                      </li>
                    ))}
                  </ul>
                  {p.protocole ? (
                    <p className="mt-2 rounded-md bg-muted p-2 text-sm">{p.protocole}</p>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => basculer.mutate({ id: p.id, actif: !p.actif })}
                >
                  <Power className="size-4" />
                  {p.actif ? "Suspendre" : "Réactiver"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
