/**
 * Règles de facturation : répartition entre l'Assurance Maladie (AMO),
 * la complémentaire (AMC) et le reste à charge du patient, puis numérotation
 * séquentielle des factures.
 *
 * Les taux sont ceux du régime général pour les actes infirmiers. Ils sont
 * paramétrables par cabinet et doivent être vérifiés avant facturation réelle.
 */

export const TAUX_AMO_STANDARD = 0.6;

export interface DroitsPatient {
  /** Affection de longue durée : prise en charge à 100 % par l'AMO */
  ald?: boolean;
  /** Exonération du ticket modérateur (maternité, AT/MP, CSS…) */
  exoneration?: string | null;
  /** Le cabinet fait l'avance de frais : la part patient reste due par le patient */
  tiersPayant?: boolean;
  /** Une mutuelle est connue : elle prend le ticket modérateur */
  mutuelle?: boolean;
}

export interface RepartitionFacture {
  amo: number;
  amc: number;
  patient: number;
  total: number;
  tauxAmo: number;
  explication: string;
}

const arrondi = (n: number) => Math.round(n * 100) / 100;

/** Répartit un montant total entre AMO, AMC et patient selon les droits ouverts. */
export function repartir(total: number, droits: DroitsPatient = {}): RepartitionFacture {
  const base = arrondi(Math.max(0, total));
  const exonere = !!droits.ald || !!(droits.exoneration && droits.exoneration.trim() !== "");
  const tauxAmo = exonere ? 1 : TAUX_AMO_STANDARD;
  const amo = arrondi(base * tauxAmo);
  const reste = arrondi(base - amo);
  const amc = droits.mutuelle ? reste : 0;
  const patient = arrondi(reste - amc);

  const explication = exonere
    ? droits.ald
      ? "ALD : prise en charge à 100 % par l'Assurance Maladie."
      : "Exonération du ticket modérateur : prise en charge à 100 % par l'Assurance Maladie."
    : droits.mutuelle
      ? "Régime général : 60 % Assurance Maladie, 40 % complémentaire."
      : "Régime général : 60 % Assurance Maladie, 40 % à la charge du patient.";

  return { amo, amc, patient, total: base, tauxAmo, explication };
}

/** Numéro de facture lisible et strictement croissant : 2026-0007. */
export function numeroFacture(annee: number, sequence: number): string {
  return `${annee}-${String(sequence).padStart(4, "0")}`;
}

/** Déduit la prochaine séquence à partir des numéros déjà émis dans l'année. */
export function prochaineSequence(numeros: string[], annee: number): number {
  const prefixe = `${annee}-`;
  const max = numeros
    .filter((n) => n.startsWith(prefixe))
    .map((n) => Number(n.slice(prefixe.length)))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return max + 1;
}

export interface LigneFacturable {
  date_acte: string;
  code: string;
  libelle: string;
  coefficient: number;
  taux: number;
  montant: number;
}

export interface CotationFacturable {
  id: string;
  intervention_id: string;
  calcule_le: string;
  total: number;
  lignes: unknown;
  majorations: unknown;
  deplacement: unknown;
}

interface LigneBrute {
  code?: string;
  libelle?: string;
  coefficient?: number;
  taux?: number;
  montant?: number;
}

const versTableau = (v: unknown): LigneBrute[] => (Array.isArray(v) ? (v as LigneBrute[]) : []);

/** Aplatit une cotation enregistrée en lignes de facture (actes, majorations, déplacement). */
export function lignesDepuisCotation(cotation: CotationFacturable): LigneFacturable[] {
  const date = cotation.calcule_le.slice(0, 10);
  const construire = (l: LigneBrute, tauxParDefaut: number): LigneFacturable => ({
    date_acte: date,
    code: l.code ?? "—",
    libelle: l.libelle ?? l.code ?? "Ligne",
    coefficient: Number(l.coefficient ?? 1),
    taux: Math.round(l.taux ?? tauxParDefaut),
    montant: arrondi(Number(l.montant ?? 0)),
  });

  return [
    ...versTableau(cotation.lignes).map((l) => construire(l, 100)),
    ...versTableau(cotation.majorations).map((l) => construire(l, 100)),
    ...versTableau(cotation.deplacement).map((l) => construire(l, 100)),
  ].filter((l) => l.montant > 0);
}

/** Bornes de période couvertes par un lot de cotations. */
export function periodeDe(cotations: CotationFacturable[]): { debut: string; fin: string } {
  const dates = cotations.map((c) => c.calcule_le.slice(0, 10)).sort();
  const aujourdhui = new Date().toISOString().slice(0, 10);
  return { debut: dates[0] ?? aujourdhui, fin: dates[dates.length - 1] ?? aujourdhui };
}

export type StatutFacture =
  | "brouillon"
  | "a_envoyer"
  | "envoyee"
  | "payee"
  | "partielle"
  | "rejetee"
  | "litige"
  | "annulee";

/** Statut déduit du montant encaissé : la comptabilité ne se saisit pas à la main. */
export function statutApresPaiement(
  total: number,
  montantPaye: number,
  statutActuel: StatutFacture,
): StatutFacture {
  if (statutActuel === "annulee" || statutActuel === "litige") return statutActuel;
  if (montantPaye <= 0) return statutActuel === "payee" ? "a_envoyer" : statutActuel;
  if (arrondi(montantPaye) + 0.009 >= arrondi(total)) return "payee";
  return "partielle";
}

export const LIBELLES_STATUT: Record<StatutFacture, string> = {
  brouillon: "Brouillon",
  a_envoyer: "À envoyer",
  envoyee: "Envoyée",
  payee: "Payée",
  partielle: "Partiellement payée",
  rejetee: "Rejetée",
  litige: "Litige",
  annulee: "Annulée",
};
