import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { creerCabinet, profilQueryOptions } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/bienvenue")({
  component: Bienvenue,
});

function Bienvenue() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profil } = useQuery(profilQueryOptions);
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("Grenoble");
  const [codePostal, setCodePostal] = useState("38100");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");

  const creation = useMutation({
    mutationFn: creerCabinet,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Votre cabinet est créé.");
      navigate({ to: "/tournee" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profil?.cabinet_id) {
    navigate({ to: "/tournee", replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12">
      <p className="text-sm font-medium text-primary">Première étape</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Créons votre cabinet</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ces informations servent à calculer vos indemnités de déplacement et à identifier vos
        documents. Vous pourrez tout modifier plus tard.
      </p>

      <form
        className="carte-clinique mt-8 space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          creation.mutate({
            nom,
            ville,
            code_postal: codePostal,
            adresse_ligne1: adresse,
            telephone,
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="nom">Nom du cabinet</Label>
          <Input
            id="nom"
            required
            placeholder="Cabinet infirmier des Alpes"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adresse">Adresse</Label>
          <Input
            id="adresse"
            placeholder="12 rue des Alliés"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cp">Code postal</Label>
            <Input id="cp" value={codePostal} onChange={(e) => setCodePostal(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="ville">Ville</Label>
            <Input id="ville" value={ville} onChange={(e) => setVille(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tel">Téléphone</Label>
          <Input id="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={creation.isPending}>
          {creation.isPending ? "Création…" : "Créer mon cabinet"}
        </Button>
      </form>
    </div>
  );
}
