import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion — Cabinet, le poste de pilotage des infirmiers libéraux" },
      {
        name: "description",
        content:
          "Connectez-vous à Cabinet pour gérer vos tournées, vos dossiers patients et vos cotations NGAP.",
      },
      { property: "og:title", content: "Connexion — Cabinet" },
      { property: "og:description", content: "Accès sécurisé à votre cabinet infirmier." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/tournee" });
  },
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    try {
      if (mode === "inscription") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: motDePasse,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nom, prenom },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
        if (error) throw error;
      }
      navigate({ to: "/tournee" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="font-display text-2xl font-semibold">Cabinet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "connexion"
            ? "Reprenez votre tournée là où vous l'avez laissée."
            : "Créez votre espace sécurisé en moins d'une minute."}
        </p>

        <form onSubmit={soumettre} className="carte-clinique mt-6 space-y-4 p-6">
          {mode === "inscription" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom</Label>
                <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
              </div>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mdp">Mot de passe</Label>
            <Input
              id="mdp"
              type="password"
              autoComplete={mode === "connexion" ? "current-password" : "new-password"}
              minLength={8}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={enCours}>
            {enCours ? "Un instant…" : mode === "connexion" ? "Se connecter" : "Créer mon espace"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "connexion" ? "inscription" : "connexion")}
          className="mt-4 w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {mode === "connexion" ? "Je n'ai pas encore de compte" : "J'ai déjà un compte"}
        </button>
      </div>
    </div>
  );
}
