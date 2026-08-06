/**
 * Export comptable : livre de recettes et journal des factures.
 *
 * Le format cible est un CSV lisible par Excel/LibreOffice en France :
 * séparateur point-virgule, décimales à la virgule, BOM UTF-8 pour les accents.
 * Aucune donnée médicale n'est exportée — uniquement l'identité de facturation
 * et les montants, comme l'exige un livre de recettes.
 */

const arrondi = (n: number) => Math.round(n * 100) / 100;

/** Formate un nombre en décimal français : 1234.5 → "1234,50". */
export function nombreFr(n: number): string {
  return arrondi(Number.isFinite(n) ? n : 0)
    .toFixed(2)
    .replace(".", ",");
}

/** Échappe une cellule CSV (guillemets doublés, encadrement si nécessaire). */
export function cellule(valeur: string | number | null | undefined): string {
  const texte = valeur === null || valeur === undefined ? "" : String(valeur);
  return /[";\n\r]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
}

/** Assemble un CSV français avec BOM UTF-8. */
export function versCsv(entetes: string[], lignes: (string | number | null)[][]): string {
  const corps = [entetes, ...lignes].map((l) => l.map(cellule).join(";")).join("\r\n");
  return `\uFEFF${corps}\r\n`;
}

export interface FactureComptable {
  numero: string;
  patient: string;
  periode_debut: string;
  periode_fin: string;
  statut: string;
  total: number;
  montant_paye: number;
  part_amo: number;
  part_amc: number;
  part_patient: number;
  date_envoi?: string | null;
  date_paiement?: string | null;
}

/** Journal des factures : une ligne par facture, tous statuts confondus. */
export function csvFactures(factures: FactureComptable[]): string {
  return versCsv(
    [
      "Numéro",
      "Patient",
      "Période début",
      "Période fin",
      "Statut",
      "Total",
      "Part AMO",
      "Part mutuelle",
      "Part patient",
      "Encaissé",
      "Reste dû",
      "Date envoi",
      "Date paiement",
    ],
    factures.map((f) => [
      f.numero,
      f.patient,
      f.periode_debut,
      f.periode_fin,
      f.statut,
      nombreFr(f.total),
      nombreFr(f.part_amo),
      nombreFr(f.part_amc),
      nombreFr(f.part_patient),
      nombreFr(f.montant_paye),
      nombreFr(arrondi(f.total) - arrondi(f.montant_paye)),
      f.date_envoi ?? "",
      f.date_paiement ?? "",
    ]),
  );
}

export interface RecetteComptable {
  date_paiement: string;
  numero: string;
  patient: string;
  source: string;
  montant: number;
  reference?: string | null;
}

/** Livre de recettes : une ligne par encaissement, trié par date. */
export function csvRecettes(recettes: RecetteComptable[]): string {
  const triees = [...recettes].sort((a, b) =>
    a.date_paiement === b.date_paiement
      ? a.numero.localeCompare(b.numero)
      : a.date_paiement.localeCompare(b.date_paiement),
  );
  const lignes: (string | number | null)[][] = triees.map((r) => [
    r.date_paiement,
    r.numero,
    r.patient,
    r.source,
    r.reference ?? "",
    nombreFr(r.montant),
  ]);
  lignes.push([
    "",
    "",
    "",
    "",
    "Total encaissé",
    nombreFr(triees.reduce((s, r) => s + Number(r.montant || 0), 0)),
  ]);
  return versCsv(["Date", "Facture", "Patient", "Mode", "Référence", "Montant"], lignes);
}

/** Totaux de l'exercice, utiles pour la déclaration BNC. */
export function totauxExercice(
  recettes: RecetteComptable[],
  annee: number,
): { annee: number; encaisse: number; nombre: number } {
  const filtrees = recettes.filter((r) => r.date_paiement.slice(0, 4) === String(annee));
  return {
    annee,
    encaisse: arrondi(filtrees.reduce((s, r) => s + Number(r.montant || 0), 0)),
    nombre: filtrees.length,
  };
}

/** Nom de fichier normalisé et daté. */
export function nomExport(prefixe: string, annee: number): string {
  return `${prefixe}-${annee}.csv`;
}
