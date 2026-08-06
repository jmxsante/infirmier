import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, Phone, Plus, Search, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
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
import { supabase } from "@/integrations/supabase/client";
import { useCabinet } from "@/hooks/use-cabinet";
import {
  correspond,
  nomAffiche,
  normaliserRpps,
  rppsValide,
  SPECIALITES,
  trierPrescripteurs,
} from "@/lib/prescripteurs";

export const Route = createFileRoute("/_authenticated/prescripteurs")({
  head: () => ({
    meta: [
      { title: "Prescripteurs — Cabinet" },
      {
        name: "description",
        content:
          "Le carnet des médecins prescripteurs : coordonnées, spécialité, RPPS et contact préféré.",
      },
      { property: "og:title", content: "Prescripteurs — Cabinet" },
      {
        property: "og:description",
        content: "Un carnet unique pour joindre le bon médecin en dix secondes.",
      },
    ],
  }),
  component: Prescripteurs,
});

const CIVILITES = ["Dr", "Pr", "M", "Mme"] as const;

function Prescripteurs() {
  const { cabinetId } = useCabinet();
  const queryClient = useQueryClient();
  const [requete, setRequete] = useState("");
  const [ouvert, setOuvert] = useState(false);

  const [civilite, setCivilite] = useState<string>("Dr");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [specialite, setSpecialite] = useState<string>(SPECIALITES[0]);
  const [rpps, setRpps] = useState("");
  const [structure, setStructure] = useState("");
  const [ville, setVille] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const liste = useQuery({
    queryKey: ["prescripteurs", cabinetId],
    enabled: !!cabinetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescripteurs")
        .select(
          "id, civilite, nom, prenom, specialite, numero_rpps, structure, ville, telephone, email, notes",
        )
        .order("nom");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  function reinitialiser() {
    setCivilite("Dr");
    setNom("");
    setPrenom("");
    setSpecialite(SPECIALITES[0]);
    setRpps("");
    setStructure("");
    setVille("");
    setTelephone("");
    setEmail("");
    setNotes("");
  }

  const creation = useMutation({
    mutationFn: async () => {
      if (!cabinetId) throw new Error("Cabinet introuvable");
      if (!nom.trim()) throw new Error("Le nom du prescripteur est obligatoire.");
      if (!rppsValide(rpps)) throw new Error("Le numéro RPPS doit comporter 11 chiffres.");
      const { error } = await supabase.from("prescripteurs").insert({
        cabinet_id: cabinetId,
        civilite: civilite === "M" || civilite === "Mme" ? civilite : null,
        nom: nom.trim(),
        prenom: prenom.trim() || null,
        specialite: specialite,
        numero_rpps: normaliserRpps(rpps) || null,
        structure: structure.trim() || null,
        ville: ville.trim() || null,
        telephone: telephone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescripteurs"] });
      toast.success("Prescripteur ajouté au carnet.");
      setOuvert(false);
      reinitialiser();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtres = trierPrescripteurs(
    (liste.data ?? []).filter((p) => correspond(p, requete)),
  );

  return (
    <AppShell
      titre="Prescripteurs"
      sousTitre="Le carnet des médecins : joindre le bon interlocuteur, sans chercher."
      action={
        <Dialog open={ouvert} onOpenChange={setOuvert}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau prescripteur</DialogTitle>
              <DialogDescription>
                Le nom et la spécialité suffisent : le reste peut se compléter plus tard.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-[7rem_1fr] gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="civilite">Civilité</Label>
                  <Select value={civilite} onValueChange={setCivilite}>
                    <SelectTrigger id="civilite">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CIVILITES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="specialite">Spécialité</Label>
                  <Select value={specialite} onValueChange={setSpecialite}>
                    <SelectTrigger id="specialite">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALITES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rpps">Numéro RPPS</Label>
                  <Input
                    id="rpps"
                    inputMode="numeric"
                    value={rpps}
                    onChange={(e) => setRpps(normaliserRpps(e.target.value))}
                    placeholder="11 chiffres"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ville">Ville</Label>
                  <Input
                    id="ville"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    placeholder="Grenoble"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="structure">Cabinet / structure</Label>
                <Input
                  id="structure"
                  value={structure}
                  onChange={(e) => setStructure(e.target.value)}
                  placeholder="Maison de santé Vigny-Musset"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    inputMode="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Joignable le matin, secrétariat fermé le mercredi…"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                className="w-full"
                onClick={() => creation.mutate()}
                disabled={creation.isPending}
              >
                {creation.isPending ? "Enregistrement…" : "Ajouter au carnet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder="Rechercher un médecin, une spécialité, une ville…"
          className="h-12 pl-9"
          aria-label="Rechercher un prescripteur"
        />
      </div>

      {liste.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement du carnet…</p>
      ) : filtres.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun prescripteur {requete ? "ne correspond à cette recherche" : "enregistré"}.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtres.map((p) => (
            <li key={p.id} className="carte-clinique p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{nomAffiche(p)}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Stethoscope className="size-3.5" />
                    {p.specialite}
                    {p.ville ? ` · ${p.ville}` : ""}
                  </p>
                </div>
                {p.numero_rpps ? (
                  <Badge variant="secondary" className="chiffres-tabulaires shrink-0">
                    RPPS {p.numero_rpps}
                  </Badge>
                ) : null}
              </div>
              {p.structure ? (
                <p className="mt-2 text-sm text-muted-foreground">{p.structure}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {p.telephone ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={`tel:${p.telephone}`}>
                      <Phone className="size-4" />
                      {p.telephone}
                    </a>
                  </Button>
                ) : null}
                {p.email ? (
                  <Button asChild size="sm" variant="ghost">
                    <a href={`mailto:${p.email}`}>
                      <Mail className="size-4" />
                      Écrire
                    </a>
                  </Button>
                ) : null}
              </div>
              {p.notes ? <p className="mt-2 text-sm">{p.notes}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
