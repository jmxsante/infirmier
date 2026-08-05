/**
 * Règles des ordonnances et des pièces jointes du dossier.
 *
 * Une ordonnance est la pièce qui autorise la facturation d'un acte prescrit :
 * si elle est absente ou expirée, la CPAM peut rejeter. Ces fonctions rendent
 * cette réalité visible avant le passage, pas après le rejet.
 */

export type StatutOrdonnance = "a_recuperer" | "valide" | "expiree" | "annulee";

export const LIBELLES_STATUT_ORDONNANCE: Record<StatutOrdonnance, string> = {
  a_recuperer: "À récupérer",
  valide: "Valide",
  expiree: "Expirée",
  annulee: "Annulée",
};

export interface OrdonnanceEvaluable {
  statut: StatutOrdonnance;
  date_debut?: string | null;
  date_fin?: string | null;
  fichier_path?: string | null;
}

const jour = 24 * 3600 * 1000;

const enJours = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / jour;

/** Jours restants avant la fin de validité. `null` si l'ordonnance n'a pas de terme. */
export function joursRestants(dateFin: string | null | undefined, aujourdhui: string): number | null {
  if (!dateFin) return null;
  return Math.round(enJours(dateFin) - enJours(aujourdhui));
}

/**
 * Statut réellement applicable aujourd'hui : le stockage peut dire « valide »
 * alors que la date de fin est passée. La vérité, c'est le calendrier.
 */
export function statutEffectif(o: OrdonnanceEvaluable, aujourdhui: string): StatutOrdonnance {
  if (o.statut === "annulee") return "annulee";
  if (o.statut === "a_recuperer") return "a_recuperer";
  const restants = joursRestants(o.date_fin, aujourdhui);
  if (restants !== null && restants < 0) return "expiree";
  if (o.date_debut && enJours(o.date_debut) > enJours(aujourdhui)) return "valide";
  return o.statut === "expiree" ? "expiree" : "valide";
}

export interface AlerteOrdonnance {
  niveau: "info" | "attention" | "urgent";
  message: string;
}

/** Alerte affichée dans le dossier : récupération, échéance proche, expiration. */
export function alerteOrdonnance(
  o: OrdonnanceEvaluable,
  aujourdhui: string,
): AlerteOrdonnance | null {
  const statut = statutEffectif(o, aujourdhui);
  if (statut === "annulee") return null;
  if (statut === "a_recuperer")
    return { niveau: "urgent", message: "Ordonnance à récupérer auprès du prescripteur." };
  if (statut === "expiree")
    return { niveau: "urgent", message: "Ordonnance expirée : renouvellement à demander." };
  if (!o.fichier_path)
    return { niveau: "attention", message: "Aucun justificatif scanné n'est joint." };
  const restants = joursRestants(o.date_fin, aujourdhui);
  if (restants !== null && restants <= 14)
    return {
      niveau: "attention",
      message:
        restants === 0
          ? "Dernier jour de validité."
          : `Expire dans ${restants} jour${restants > 1 ? "s" : ""}.`,
    };
  return null;
}

/** L'ordonnance couvre-t-elle toute la période d'un plan de soins ? */
export function couvreLaPeriode(
  o: OrdonnanceEvaluable,
  debut: string,
  fin: string | null | undefined,
): boolean {
  if (o.statut === "annulee" || o.statut === "a_recuperer") return false;
  if (o.date_debut && enJours(o.date_debut) > enJours(debut)) return false;
  if (!o.date_fin) return true;
  if (!fin) return false;
  return enJours(o.date_fin) >= enJours(fin);
}

export const TAILLE_MAX_OCTETS = 15 * 1024 * 1024;

export const TYPES_ACCEPTES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

/** Nom de fichier neutralisé : pas d'accent, pas de séparateur, pas de traversée de chemin. */
export function nomFichierSur(nom: string): string {
  const base = nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^[-.]+/, "")
    .replace(/-+/g, "-")
    .slice(-80);
  return base || "document";
}

/** Chemin de dépôt : le premier segment est le cabinet, ce que la policy RLS exige. */
export function cheminStockage(
  cabinetId: string,
  patientId: string,
  nom: string,
  horodatage = Date.now(),
): string {
  return `${cabinetId}/${patientId}/${horodatage}-${nomFichierSur(nom)}`;
}

/** Refuse tôt ce que le stockage refuserait tard. */
export function verifierFichier(fichier: { name: string; size: number; type: string }): string | null {
  if (fichier.size === 0) return "Le fichier est vide.";
  if (fichier.size > TAILLE_MAX_OCTETS) return "Fichier trop lourd (15 Mo maximum).";
  if (fichier.type && !TYPES_ACCEPTES.includes(fichier.type as (typeof TYPES_ACCEPTES)[number]))
    return "Format non accepté : PDF, JPEG, PNG, WEBP ou HEIC.";
  return null;
}

/** Poids lisible par un humain pressé. */
export function poidsLisible(octets: number | null | undefined): string {
  if (!octets || octets <= 0) return "—";
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}
