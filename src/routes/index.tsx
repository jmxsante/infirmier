import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cabinet — le poste de pilotage des infirmiers libéraux" },
      {
        name: "description",
        content:
          "Tournées, dossiers patients, cotation NGAP et facturation : tout le quotidien d'un cabinet infirmier libéral, dans une seule application claire.",
      },
      { property: "og:title", content: "Cabinet — le poste de pilotage des infirmiers libéraux" },
      {
        property: "og:description",
        content: "Tournées, dossiers patients, cotation NGAP et facturation : tout le quotidien d'un cabinet infirmier libéral, dans une seule application claire.",
      },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-primary">Pour les infirmiers libéraux</p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
        Votre journée de soins, enfin sous contrôle.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Cabinet réunit la tournée du jour, les dossiers patients, les plans de soins et la cotation
        NGAP. Pensé pour le terrain : gros boutons, lecture rapide, zéro jargon informatique.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/auth"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ouvrir mon cabinet
        </Link>
      </div>

      <dl className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          ["Tournée", "Le déroulé du jour, passage par passage, avec pointage en un geste."],
          ["Dossiers", "Accès au domicile, ordonnances, transmissions et plan de soins."],
          ["Cotation", "Règles NGAP appliquées automatiquement, y compris le non-cumul."],
        ].map(([titre, texte]) => (
          <div key={titre} className="carte-clinique p-5">
            <dt className="font-display text-lg font-semibold">{titre}</dt>
            <dd className="mt-1 text-sm text-muted-foreground">{texte}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
