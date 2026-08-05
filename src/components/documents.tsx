import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCabinet } from "@/hooks/use-cabinet";
import { cheminStockage, poidsLisible, TYPES_ACCEPTES, verifierFichier } from "@/lib/ordonnances";

const TYPES = [
  { valeur: "compte_rendu", label: "Compte rendu" },
  { valeur: "photo_plaie", label: "Photo de plaie" },
  { valeur: "resultat", label: "Résultat d'examen" },
  { valeur: "consentement", label: "Consentement" },
  { valeur: "autre", label: "Autre" },
] as const;

type TypeDocument = (typeof TYPES)[number]["valeur"];

const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

/** Pièces du dossier : dépôt sécurisé, consultation par lien signé, suppression tracée. */
export function Documents({ patientId }: { patientId: string }) {
  const { cabinetId, profil } = useCabinet();
  const queryClient = useQueryClient();
  const fichierRef = useRef<HTMLInputElement>(null);
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<TypeDocument>("compte_rendu");
  const [fichier, setFichier] = useState<File | null>(null);

  const liste = useQuery({
    queryKey: ["documents", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, titre, type, storage_path, mime_type, taille_octets, created_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const deposer = useMutation({
    mutationFn: async () => {
      if (!cabinetId) throw new Error("Cabinet introuvable");
      if (!fichier) throw new Error("Choisissez un fichier à déposer.");
      const probleme = verifierFichier(fichier);
      if (probleme) throw new Error(probleme);

      const chemin = cheminStockage(cabinetId, patientId, fichier.name);
      const { error: erreurDepot } = await supabase.storage
        .from("dossiers")
        .upload(chemin, fichier, fichier.type ? { contentType: fichier.type } : {});
      if (erreurDepot) throw new Error(`Dépôt impossible : ${erreurDepot.message}`);

      const { error } = await supabase.from("documents").insert({
        cabinet_id: cabinetId,
        patient_id: patientId,
        type,
        titre: titre.trim() || fichier.name,
        storage_path: chemin,
        mime_type: fichier.type || null,
        taille_octets: fichier.size,
        ajoute_par: profil?.id ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", patientId] });
      toast.success("Document déposé.");
      setTitre("");
      setFichier(null);
      if (fichierRef.current) fichierRef.current.value = "";
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const supprimer = useMutation({
    mutationFn: async ({ id, chemin }: { id: string; chemin: string }) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await supabase.storage.from("dossiers").remove([chemin]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", patientId] });
      toast.success("Document supprimé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function ouvrir(chemin: string) {
    const { data, error } = await supabase.storage.from("dossiers").createSignedUrl(chemin, 120);
    if (error || !data) {
      toast.error("Document indisponible.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="carte-clinique p-5 md:col-span-2">
      <h2 className="font-display text-lg font-semibold">Documents</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Comptes rendus, photos de plaie, résultats : tout reste dans le dossier, jamais dans une
        galerie de téléphone.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="doc-titre">Intitulé</Label>
          <Input
            id="doc-titre"
            value={titre}
            maxLength={120}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Photo plaie J+7"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doc-type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as TypeDocument)}>
            <SelectTrigger id="doc-type" className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t.valeur} value={t.valeur}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => deposer.mutate()} disabled={deposer.isPending}>
          <Upload className="size-4" />
          {deposer.isPending ? "Dépôt…" : "Déposer"}
        </Button>
      </div>

      <div className="mt-3 space-y-1.5">
        <Label htmlFor="doc-fichier">Fichier (PDF, JPEG, PNG — 15 Mo max)</Label>
        <Input
          id="doc-fichier"
          ref={fichierRef}
          type="file"
          accept={TYPES_ACCEPTES.join(",")}
          onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
        />
      </div>

      <ul className="mt-5 space-y-2">
        {liste.isLoading ? (
          <li className="text-sm text-muted-foreground">Chargement…</li>
        ) : (liste.data?.length ?? 0) === 0 ? (
          <li className="text-sm text-muted-foreground">Aucun document au dossier.</li>
        ) : (
          liste.data!.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{d.titre}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">
                    {TYPES.find((t) => t.valeur === d.type)?.label ?? d.type}
                  </Badge>
                  <span>{dateFr.format(new Date(d.created_at))}</span>
                  <span>· {poidsLisible(d.taille_octets)}</span>
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Ouvrir le document"
                  onClick={() => ouvrir(d.storage_path)}
                >
                  <Download className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Supprimer le document"
                  onClick={() => supprimer.mutate({ id: d.id, chemin: d.storage_path })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
