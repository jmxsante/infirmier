import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catalogueQueryOptions, type ActeCatalogue } from "@/lib/catalogue";

/**
 * Sélecteur d'actes adossé au catalogue NGAP officiel.
 * Pensé pour le pouce : une recherche, une liste, un bouton par ligne.
 */
export function SelecteurActes({
  onAjouter,
  placeholder = "Chercher un acte : pansement, injection, perfusion…",
}: {
  onAjouter: (acte: ActeCatalogue) => void;
  placeholder?: string;
}) {
  const [recherche, setRecherche] = useState("");
  const { data, isLoading } = useQuery(catalogueQueryOptions(recherche));

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
          aria-label="Rechercher un acte du catalogue NGAP"
        />
      </div>

      <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
        {isLoading ? (
          <li className="text-sm text-muted-foreground">Recherche dans le catalogue…</li>
        ) : (data?.length ?? 0) === 0 ? (
          <li className="text-sm text-muted-foreground">
            Aucun acte ne correspond. Essayez un mot plus court, par exemple « pansement ».
          </li>
        ) : (
          data!.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border/70 p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="chiffres-tabulaires">
                    {a.lettre_cle} {Number(a.coefficient)}
                  </Badge>
                  {a.prescription_obligatoire ? (
                    <Badge variant="outline">Sur prescription</Badge>
                  ) : null}
                  {a.bsi_requis ? <Badge variant="outline">BSI requis</Badge> : null}
                </div>
                <p className="mt-1.5 text-sm font-medium leading-snug">{a.libelle}</p>
                {a.chapitre ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.chapitre}</p>
                ) : null}
              </div>
              <Button size="sm" variant="outline" onClick={() => onAjouter(a)} aria-label="Ajouter">
                <Plus className="size-4" />
              </Button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
