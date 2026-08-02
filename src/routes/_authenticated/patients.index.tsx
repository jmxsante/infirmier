import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCabinet } from "@/hooks/use-cabinet";

export const Route = createFileRoute("/_authenticated/patients")({
  head: () => ({
    meta: [
      { title: "Patients — Cabinet" },
      {
        name: "description",
        content:
          "Vos dossiers patients : coordonnées, accès au domicile, ordonnances, plans de soins et transmissions.",
      },
      { property: "og:title", content: "Patients — Cabinet" },
      { property: "og:description", content: "Tous vos dossiers patients au même endroit." },
    ],
  }),
  component: Patients,
});

function Patients() {
  const { cabinetId } = useCabinet();
  const queryClient = useQueryClient();
  const [recherche, setRecherche] = useState("");
  const [ouvert, setOuvert] = useState(false);

  const patients = useQuery({
    queryKey: ["patients", cabinetId],
    enabled: !!cabinetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, nom, prenom, ville, code_postal, telephone, statut, ald")
        .order("nom", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const creation = useMutation({
    mutationFn: async (form: FormData) => {
      if (!cabinetId) throw new Error("Cabinet introuvable");
      const valeur = (k: string) => String(form.get(k) ?? "").trim();
      const { data, error } = await supabase
        .from("patients")
        .insert({
          cabinet_id: cabinetId,
          nom: valeur("nom"),
          prenom: valeur("prenom"),
          date_naissance: valeur("date_naissance") || null,
          telephone: valeur("telephone") || null,
          adresse_ligne1: valeur("adresse_ligne1"),
          code_postal: valeur("code_postal"),
          ville: valeur("ville"),
          acces_etage: valeur("acces_etage") || null,
          acces_code: valeur("acces_code") || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setOuvert(false);
      toast.success("Patient créé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const liste = (patients.data ?? []).filter((p) =>
    `${p.prenom} ${p.nom} ${p.ville}`.toLowerCase().includes(recherche.toLowerCase()),
  );

  return (
    <AppShell
      titre="Patients"
      sousTitre="Dossiers, accès au domicile et suivi"
      action={
        <Dialog open={ouvert} onOpenChange={setOuvert}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Nouveau patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau patient</DialogTitle>
              <DialogDescription>
                L'essentiel suffit pour commencer : vous compléterez le dossier plus tard.
              </DialogDescription>
            </DialogHeader>
            <form
              id="form-patient"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                creation.mutate(new FormData(e.currentTarget));
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input id="prenom" name="prenom" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" name="nom" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="date_naissance">Date de naissance</Label>
                  <Input id="date_naissance" name="date_naissance" type="date" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" name="telephone" type="tel" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adresse_ligne1">Adresse</Label>
                <Input id="adresse_ligne1" name="adresse_ligne1" required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="code_postal">Code postal</Label>
                  <Input id="code_postal" name="code_postal" defaultValue="38100" required />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="ville">Ville</Label>
                  <Input id="ville" name="ville" defaultValue="Grenoble" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="acces_etage">Étage</Label>
                  <Input id="acces_etage" name="acces_etage" placeholder="3e, porte droite" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acces_code">Code d'entrée</Label>
                  <Input id="acces_code" name="acces_code" placeholder="A1234" />
                </div>
              </div>
            </form>
            <DialogFooter>
              <Button type="submit" form="form-patient" disabled={creation.isPending}>
                {creation.isPending ? "Enregistrement…" : "Créer le dossier"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un nom, une ville…"
          className="pl-9"
        />
      </div>

      {patients.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des dossiers…</p>
      ) : liste.length === 0 ? (
        <div className="carte-clinique p-8 text-center">
          <p className="font-display text-lg font-semibold">Aucun patient pour l'instant</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Créez votre premier dossier pour commencer à planifier vos passages.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {liste.map((p) => (
            <li key={p.id}>
              <Link
                to="/patients/$patientId"
                params={{ patientId: p.id }}
                className="carte-clinique block p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg font-semibold">
                    {p.prenom} {p.nom}
                  </p>
                  {p.ald ? <Badge variant="secondary">ALD</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.code_postal} {p.ville}
                  {p.telephone ? ` · ${p.telephone}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
