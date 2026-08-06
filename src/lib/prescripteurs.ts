/**
 * Carnet de prescripteurs : normalisation et contrôles du RPPS.
 * Le RPPS est l'identifiant national à 11 chiffres du professionnel de santé.
 */

export interface PrescripteurLisible {
  civilite?: string | null;
  nom: string;
  prenom?: string | null;
  specialite?: string | null;
  ville?: string | null;
}

/** « Dr Claire Meunier — Médecin généraliste » */
export function nomAffiche(p: PrescripteurLisible): string {
  const civilite = p.civilite && p.civilite !== "Autre" ? `${p.civilite} ` : "";
  const prenom = p.prenom?.trim() ? `${p.prenom.trim()} ` : "";
  return `${civilite}${prenom}${p.nom.trim()}`.trim();
}

/** Ne garde que les chiffres saisis, au plus 11. */
export function normaliserRpps(valeur: string): string {
  return valeur.replace(/\D+/g, "").slice(0, 11);
}

/** Un RPPS est valide s'il est vide (non renseigné) ou composé de 11 chiffres. */
export function rppsValide(valeur: string | null | undefined): boolean {
  if (!valeur || valeur.trim() === "") return true;
  return /^\d{11}$/.test(normaliserRpps(valeur));
}

/** Recherche tolérante aux accents et à la casse sur nom, spécialité, structure et ville. */
export function correspond(p: PrescripteurLisible & { structure?: string | null }, requete: string) {
  const sans = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const q = sans(requete.trim());
  if (!q) return true;
  const champ = sans(
    [p.nom, p.prenom, p.specialite, p.structure, p.ville].filter(Boolean).join(" "),
  );
  return q.split(/\s+/).every((mot) => champ.includes(mot));
}

/** Tri alphabétique stable sur nom puis prénom. */
export function trierPrescripteurs<T extends PrescripteurLisible>(liste: T[]): T[] {
  return [...liste].sort(
    (a, b) =>
      a.nom.localeCompare(b.nom, "fr") || (a.prenom ?? "").localeCompare(b.prenom ?? "", "fr"),
  );
}

export const SPECIALITES = [
  "Médecin généraliste",
  "Gériatre",
  "Cardiologue",
  "Diabétologue",
  "Chirurgien",
  "Oncologue",
  "Néphrologue",
  "Dermatologue",
  "Pneumologue",
  "Autre spécialité",
] as const;
