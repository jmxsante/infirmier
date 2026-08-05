import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileWarning, Paperclip, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCabinet } from "@/hooks/use-cabinet";
import {
  alerteOrdonnance,
  cheminStockage,
  LIBELLES_STATUT_ORDONNANCE,
  statutEffectif,
  TYPES_ACCEPTES,
  verifierFichier,
  type StatutOrdonnance,
} from "@/lib/ordonnances";
import { cn } from "@/lib/utils";

const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });
const aujourdhui = () => new Date().toISOString().slice(0, 10);

/**
 * Ordonnances du dossier : la pièce qui autorise la facturation.
 * Chaque ordonnance porte son prescripteur, sa période de validité et son scan.
 */
export function Ordonnances({ patientId }: { patientId: string }) {
  const { cabinetId, profil } = useCabinet();
  const queryClient = useQueryClient();
  const fichierRef = useRef<HTMLInputElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const [prescripteurId, setPrescripteurId] = useState<string>("");
  const [datePrescription, setDatePrescription] = useState(aujourdhui);
  const [dateDebut, setDateDebut] = useState(aujourdhui);
  const [dateFin, setDateFin] = useState("");
  const [renouvelable, setRenouvelable] = useState(false);
  const [ald, setAld] = useState(false);
  const [recue, setRecue] = useState(true);
  const [contenu, setContenu] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);

  const prescripteurs = useQuery({
    queryKey: ["prescripteurs", cabinetId],
    enabled: !!cabinetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescripteurs")
        .select("id, nom, prenom, specialite")
        .order("nom");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const liste = useQuery({
    queryKey: ["ordonnances", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordonnances")
        .select(
          "id, date_prescription, date_debut, date_fin, statut, renouvelable, renouvellements, ald, contenu, fichier_path, prescripteurs:prescripteur_id(nom, prenom, specialite)",
        )
        .eq("patient_id", patientId)
        .order("date_prescription", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  function reinitialiser() {
    setPrescripteurId("");
    setDatePrescription(aujourdhui());
    setDateDebut(aujourdhui());
    setDateFin("");
    setRenouvelable(false);
    setAld(false);
    setRecue(true);
    setContenu("");
    setFichier(null);
    if (fichierRef.current) fichierRef.current.value = "";
  }

  const creer = useMutation({
    mutationFn: async () => {
      if (!cabinetId) throw new Error("Cabinet introuvable");
      let chemin: string | null = null;
      if (fichier) {
        const probleme = verifierFichier(fichier);
        if (probleme) throw new Error(probleme);
        chemin = cheminStockage(cabinetId, patientId, fichier.name);
        const { error } = await supabase.storage
          .from("dossiers")
          .upload(chemin, fichier, { contentType: fichier.type || undefined, upsert: false });
        if (error) throw new Error(`Dépôt du scan impossible : ${error.message}`);
      }

      const { data, error } = await supabase
        .from("ordonnances")
        .insert({
          cabinet_id: cabinetId,
          patient_id: patientId,
          prescripteur_id: prescripteurId || null,
          date_prescription: datePrescription,
          date_debut: dateDebut || null,
          date_fin: dateFin || null,
          renouvelable,
          ald,
          statut: (recue ? "valide" : "a_recuperer") satisfies StatutOrdonnance,
          contenu: contenu.trim() || null,
          fichier_path: chemin,
          cree_par: profil?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      if (chemin) {
        await supabase.from("documents").insert({
          cabinet_id: cabinetId,
          patient_id: patientId,
          ordonnance_id: data.id,
          type: "ordonnance",
          titre: `Ordonnance du ${datePrescription}`,
          storage_path: chemin,
          mime_type: fichier?.type || null,
          taille_octets: fichier?.size ?? null,
          ajoute_par: profil?.id ?? null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnances", patientId] });
      queryClient.invalidateQueries({ queryKey: ["documents", patientId] });
      toast.success("Ordonnance enregistrée.");
      setOuvert(false);
      reinitialiser();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changerStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: StatutOrdonnance }) => {
      const { error } = await supabase.from("ordonnances").update({ statut }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ordonnances", patientId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  async function ouvrirScan(chemin: string) {
    const { data, error } = await supabase.storage.from("dossiers").createSignedUrl(chemin, 120);
    if (error || !data) return toast.error("Document indisponible.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const jour = aujourdhui();

  return (
    <section className="carte-clinique p-5 md:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Ordonnances</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sans ordonnance valide, un acte prescrit n'est pas facturable.
          </p>
        </div>
        <Dialog
          open={ouvert}
          onOpenChange={(v) => {
            setOuvert(v);
            if (!v) reinitialiser();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              Nouvelle ordonnance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle ordonnance</DialogTitle>
              <DialogDescription>
                Prenez le scan ou la photo maintenant : c'est la pièce qui justifie la facturation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ord-prescripteur">Prescripteur</Label>
                <Select value={prescripteurId} onValueChange={setPrescripteurId}>
                  <SelectTrigger id="ord-prescripteur">
                    <SelectValue placeholder="Choisir un prescripteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {(prescripteurs.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.prenom ? `${p.prenom} ` : ""}
                        {p.nom} — {p.specialite}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(prescripteurs.data?.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucun prescripteur enregistré : vous pourrez le renseigner plus tard.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Champ
                  id="ord-date"
                  label="Prescrite le"
                  type="date"
                  valeur={datePrescription}
                  onChange={setDatePrescription}
                />
                <Champ
                  id="ord-debut"
                  label="Début"
                  type="date"
                  valeur={dateDebut}
                  onChange={setDateDebut}
                />
                <Champ
                  id="ord-fin"
                  label="Fin"
                  type="date"
                  valeur={dateFin}
                  onChange={setDateFin}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Bascule id="ord-recue" label="En main" valeur={recue} onChange={setRecue} />
                <Bascule
                  id="ord-renouv"
                  label="Renouvelable"
                  valeur={renouvelable}
                  onChange={setRenouvelable}
                />
                <Bascule id="ord-ald" label="ALD" valeur={ald} onChange={setAld} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ord-contenu">Contenu prescrit</Label>
                <Textarea
                  id="ord-contenu"
                  rows={3}
                  value={contenu}
                  maxLength={4000}
                  onChange={(e) => setContenu(e.target.value)}
                  placeholder="Pansement quotidien de l'ulcère jambe gauche pendant 21 jours."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ord-fichier">Scan ou photo (PDF, JPEG, PNG — 15 Mo max)</Label>
                <Input
                  id="ord-fichier"
                  ref={fichierRef}
                  type="file"
                  accept={TYPES_ACCEPTES.join(",")}
                  onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setOuvert(false)}>
                Annuler
              </Button>
              <Button onClick={() => creer.mutate()} disabled={creer.isPending}>
                {creer.isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ul className="mt-4 space-y-3">
        {liste.isLoading ? (
          <li className="text-sm text-muted-foreground">Chargement…</li>
        ) : (liste.data?.length ?? 0) === 0 ? (
          <li className="text-sm text-muted-foreground">Aucune ordonnance au dossier.</li>
        ) : (
          liste.data!.map((o) => {
            const statut = statutEffectif(o as never, jour);
            const alerte = alerteOrdonnance(o as never, jour);
            return (
              <li key={o.id} className="rounded-lg border border-border/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      statut === "valide"
                        ? "secondary"
                        : statut === "annulee"
                          ? "outline"
                          : "destructive"
                    }
                  >
                    {LIBELLES_STATUT_ORDONNANCE[statut]}
                  </Badge>
                  <span className="text-sm font-medium">
                    Prescrite le {dateFr.format(new Date(o.date_prescription))}
                  </span>
                  {o.ald ? <Badge variant="outline">ALD</Badge> : null}
                  {o.renouvelable ? <Badge variant="outline">Renouvelable</Badge> : null}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {o.prescripteurs
                    ? `${o.prescripteurs.prenom ?? ""} ${o.prescripteurs.nom} · ${o.prescripteurs.specialite}`
                    : "Prescripteur non renseigné"}
                  {o.date_fin ? ` · valide jusqu'au ${dateFr.format(new Date(o.date_fin))}` : ""}
                </p>

                {o.contenu ? <p className="mt-2 whitespace-pre-wrap text-sm">{o.contenu}</p> : null}

                {alerte ? (
                  <p
                    className={cn(
                      "mt-2 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                      alerte.niveau === "urgent"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/15 text-foreground",
                    )}
                  >
                    <FileWarning className="size-3.5" />
                    {alerte.message}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {o.fichier_path ? (
                    <Button size="sm" variant="outline" onClick={() => ouvrirScan(o.fichier_path!)}>
                      <Download className="size-4" />
                      Voir le scan
                    </Button>
                  ) : null}
                  {o.statut === "a_recuperer" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changerStatut.mutate({ id: o.id, statut: "valide" })}
                    >
                      Marquer reçue
                    </Button>
                  ) : null}
                  {statut !== "annulee" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => changerStatut.mutate({ id: o.id, statut: "annulee" })}
                    >
                      Annuler
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })
        )}
      </ul>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Paperclip className="size-3.5" />
        Les scans sont stockés dans un espace privé, accessible uniquement à votre cabinet.
      </p>
    </section>
  );
}

function Champ({
  id,
  label,
  type,
  valeur,
  onChange,
}: {
  id: string;
  label: string;
  type: string;
  valeur: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={valeur} onChange={(e) => onChange(e.target.value)} />
    </div>
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
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Switch id={id} checked={valeur} onCheckedChange={onChange} />
    </div>
  );
}
