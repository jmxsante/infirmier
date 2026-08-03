import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SelecteurActes } from "@/components/selecteur-actes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type ActeCatalogue, versActeACoter } from "@/lib/catalogue";
import { calculerCotation, euros, type ContexteCotation } from "@/lib/ngap";

export const Route = createFileRoute("/_authenticated/actes")({
  head: () => ({
    meta: [
      { title: "Actes & cotation NGAP — Cabinet" },
      {
        name: "description",
        content:
          "Composez les actes réalisés et obtenez la cotation NGAP justifiée : règle de non-cumul, majorations, indemnités de déplacement.",
      },
      { property: "og:title", content: "Actes & cotation NGAP — Cabinet" },
      {
        property: "og:description",
        content: "La cotation juste, expliquée ligne par ligne, en temps réel.",
      },
    ],
  }),
  component: Actes,
});

interface Selection extends ActeCatalogue {
  quantite: number;
}

function Actes() {
  const [selection, setSelection] = useState<Selection[]>([]);
  const [contexte, setContexte] = useState<ContexteCotation>({
    aDomicile: true,
    distanceKm: 0,
    zone: "plaine",
    heure: "08:00",
  });

  const resultat = useMemo(
    () => calculerCotation(selection.map((a) => versActeACoter(a, a.quantite)), contexte),
    [selection, contexte],
  );

  function ajouter(acte: ActeCatalogue) {
    setSelection((s) =>
      s.some((x) => x.id === acte.id)
        ? s.map((x) => (x.id === acte.id ? { ...x, quantite: x.quantite + 1 } : x))
        : [...s, { ...acte, quantite: 1 }],
    );
  }

  function ajusterQuantite(id: string, delta: number) {
    setSelection((s) =>
      s
        .map((x) => (x.id === id ? { ...x, quantite: x.quantite + delta } : x))
        .filter((x) => x.quantite > 0),
    );
  }

  const maj = (patch: Partial<ContexteCotation>) => setContexte((c) => ({ ...c, ...patch }));

  return (
    <AppShell
      titre="Actes & cotation"
      sousTitre="Composez la séance, la cotation se calcule et se justifie toute seule."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className="carte-clinique p-5">
            <h2 className="font-display text-lg font-semibold">Catalogue NGAP officiel</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Titre XVI — soins infirmiers. Les coefficients proviennent du texte de la nomenclature.
            </p>
            <div className="mt-4">
              <SelecteurActes onAjouter={ajouter} />
            </div>
          </section>

          <section className="carte-clinique p-5">
            <h2 className="font-display text-lg font-semibold">Séance en cours</h2>
            {selection.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Ajoutez un premier acte depuis le catalogue ci-dessus.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
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
                        onClick={() => ajusterQuantite(a.id, -1)}
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
                        onClick={() => ajusterQuantite(a.id, 1)}
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
          </section>

          <section className="carte-clinique p-5">
            <h2 className="font-display text-lg font-semibold">Contexte de l'intervention</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Bascule
                id="domicile"
                label="Au domicile du patient"
                aide="Déclenche l'IFD et les indemnités kilométriques."
                valeur={contexte.aDomicile}
                onChange={(v) => maj({ aDomicile: v })}
              />
              <Bascule
                id="dimanche"
                label="Dimanche ou jour férié"
                valeur={!!contexte.dimancheOuFerie}
                onChange={(v) => maj({ dimancheOuFerie: v })}
              />
              <Bascule
                id="enfant"
                label="Enfant de moins de 7 ans"
                valeur={!!contexte.jeuneEnfant}
                onChange={(v) => maj({ jeuneEnfant: v })}
              />
              <Bascule
                id="mci"
                label="Coordination infirmière (MCI)"
                aide="Palliatif, plaie complexe. Non cumulable avec la MAU."
                valeur={!!contexte.coordinationInfirmiere}
                onChange={(v) => maj({ coordinationInfirmiere: v })}
              />
              <div className="space-y-1.5">
                <Label htmlFor="heure">Heure de début</Label>
                <Input
                  id="heure"
                  type="time"
                  value={contexte.heure ?? ""}
                  onChange={(e) => maj({ heure: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="km">Distance aller (km)</Label>
                <Input
                  id="km"
                  type="number"
                  min={0}
                  step="0.5"
                  value={contexte.distanceKm ?? 0}
                  onChange={(e) => maj({ distanceKm: Number(e.target.value) })}
                />
              </div>
              <Bascule
                id="montagne"
                label="Zone de montagne"
                valeur={contexte.zone === "montagne"}
                onChange={(v) => maj({ zone: v ? "montagne" : "plaine" })}
              />
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <section className="carte-clinique overflow-hidden">
            <div className="bg-primary p-5 text-primary-foreground">
              <p className="text-sm opacity-90">Total de la séance</p>
              <p className="chiffres-tabulaires font-display text-4xl font-semibold">
                {euros(resultat.total)}
              </p>
              <p className="mt-1 text-xs opacity-80">
                Actes {euros(resultat.totalActes)} · Majorations {euros(resultat.totalMajorations)} ·
                Déplacement {euros(resultat.totalDeplacement)}
              </p>
            </div>

            <div className="space-y-4 p-5">
              <Bloc titre="Actes">
                {resultat.lignes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun acte sélectionné.</p>
                ) : (
                  resultat.lignes.map((l, i) => (
                    <div key={`${l.code}-${i}`} className="border-b border-border/60 py-2 last:border-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium">
                          {l.lettreCle} {l.coefficient}
                        </span>
                        <span className="chiffres-tabulaires text-sm font-semibold">
                          {euros(l.montant)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{l.motifTaux}</p>
                    </div>
                  ))
                )}
              </Bloc>

              {resultat.majorations.length > 0 ? (
                <Bloc titre="Majorations">
                  {resultat.majorations.map((m) => (
                    <Ligne key={m.code} libelle={m.libelle} montant={m.montant} />
                  ))}
                </Bloc>
              ) : null}

              {resultat.deplacement.length > 0 ? (
                <Bloc titre="Déplacement">
                  {resultat.deplacement.map((m) => (
                    <Ligne key={m.code} libelle={m.libelle} montant={m.montant} />
                  ))}
                </Bloc>
              ) : null}

              {resultat.justification.length > 0 ? (
                <Bloc titre="Pourquoi ce montant">
                  <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    {resultat.justification.map((j) => (
                      <li key={j}>{j}</li>
                    ))}
                  </ul>
                </Bloc>
              ) : null}

              {resultat.alertes.length > 0 ? (
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                  <p className="text-sm font-semibold text-warning-foreground">Points de vigilance</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
                    {resultat.alertes.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <p className="text-xs text-muted-foreground">
                Les valeurs de lettre clé et les montants de majoration sont conventionnels : vérifiez-les
                avant toute facturation réelle.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function Bascule({
  id,
  label,
  aide,
  valeur,
  onChange,
}: {
  id: string;
  label: string;
  aide?: string;
  valeur: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/70 p-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {aide ? <p className="mt-0.5 text-xs text-muted-foreground">{aide}</p> : null}
      </div>
      <Switch id={id} checked={valeur} onCheckedChange={onChange} />
    </div>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titre}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Ligne({ libelle, montant }: { libelle: string; montant: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="text-sm">{libelle}</span>
      <span className="chiffres-tabulaires text-sm font-semibold">{euros(montant)}</span>
    </div>
  );
}
