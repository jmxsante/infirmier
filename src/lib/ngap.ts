/**
 * Moteur de cotation NGAP — Titre XVI (soins infirmiers).
 *
 * Les COEFFICIENTS et les règles de cumul proviennent du texte officiel de la
 * nomenclature. Les VALEURS DE LETTRE CLÉ et les montants de majoration sont
 * fixés par la convention nationale : ils sont paramétrables par cabinet et
 * doivent être vérifiés avant toute facturation réelle.
 */

export type LettreCle = "AMI" | "AIS" | "AMX" | "BSA" | "BSB" | "BSC" | "DI" | "AUTRE";

export interface TarifsConventionnels {
  AMI: number;
  AIS: number;
  AMX: number;
  DI: number;
  BSA: number;
  BSB: number;
  BSC: number;
  AUTRE: number;
  /** Indemnité forfaitaire de déplacement */
  IFD: number;
  /** Indemnité kilométrique, plaine */
  IK_plaine: number;
  /** Indemnité kilométrique, montagne */
  IK_montagne: number;
  /** Abattement kilométrique aller-retour (km non indemnisés) */
  IK_abattement_km: number;
  /** Majoration d'acte unique */
  MAU: number;
  /** Majoration de coordination infirmière */
  MCI: number;
  /** Majoration dimanche et jours fériés */
  MD: number;
  /** Majoration de nuit 20h-23h / 5h-8h */
  MN: number;
  /** Majoration de nuit profonde 23h-5h */
  MNP: number;
  /** Majoration jeune enfant (< 7 ans) */
  MIE: number;
}

/**
 * Valeurs par défaut, À VÉRIFIER ET PARAMÉTRER dans les réglages du cabinet
 * avant toute facturation. Elles ne sont pas issues du texte NGAP mais de la
 * convention nationale des infirmiers libéraux.
 */
export const TARIFS_PAR_DEFAUT: TarifsConventionnels = {
  AMI: 3.15,
  AIS: 3.15,
  AMX: 3.15,
  DI: 2.65,
  BSA: 13.0,
  BSB: 20.0,
  BSC: 29.0,
  AUTRE: 0,
  IFD: 2.75,
  IK_plaine: 0.5,
  IK_montagne: 0.62,
  IK_abattement_km: 4,
  MAU: 1.35,
  MCI: 5.0,
  MD: 8.5,
  MN: 9.15,
  MNP: 10.0,
  MIE: 3.7,
};

export interface ActeACoter {
  id: string;
  code: string;
  libelle: string;
  lettreCle: LettreCle;
  coefficient: number;
  quantite?: number;
  /** Acte facturable à taux plein même en cumul (perfusions, forfaits...) */
  horsRegleCumul?: boolean;
}

export interface ContexteCotation {
  /** Déplacement au domicile du patient */
  aDomicile: boolean;
  /** Distance aller simple depuis le cabinet, en km */
  distanceKm?: number;
  zone?: "plaine" | "montagne";
  /** Heure de début de l'intervention, format HH:mm */
  heure?: string;
  dimancheOuFerie?: boolean;
  /** Patient de moins de 7 ans */
  jeuneEnfant?: boolean;
  /** Prise en charge relevant de la coordination infirmière (palliatif, plaie complexe) */
  coordinationInfirmiere?: boolean;
  tarifs?: TarifsConventionnels;
}

export interface LigneCotation {
  code: string;
  libelle: string;
  lettreCle: LettreCle;
  coefficient: number;
  quantite: number;
  /** 100, 50 ou 0 selon la règle de cumul */
  taux: number;
  montant: number;
  motifTaux: string;
}

export interface LigneMajoration {
  code: string;
  libelle: string;
  montant: number;
}

export interface ResultatCotation {
  lignes: LigneCotation[];
  majorations: LigneMajoration[];
  deplacement: LigneMajoration[];
  totalActes: number;
  totalMajorations: number;
  totalDeplacement: number;
  total: number;
  justification: string[];
  alertes: string[];
}

const arrondi = (n: number) => Math.round(n * 100) / 100;

function estNuit(heure?: string): "aucune" | "nuit" | "nuit_profonde" {
  if (!heure) return "aucune";
  const [h] = heure.split(":").map(Number);
  if (Number.isNaN(h)) return "aucune";
  if (h >= 23 || h < 5) return "nuit_profonde";
  if (h >= 20 || h < 8) return "nuit";
  return "aucune";
}

export function calculerCotation(
  actes: ActeACoter[],
  contexte: ContexteCotation,
): ResultatCotation {
  const t = contexte.tarifs ?? TARIFS_PAR_DEFAUT;
  const justification: string[] = [];
  const alertes: string[] = [];

  const developpes = actes.flatMap((a) =>
    Array.from({ length: Math.max(1, a.quantite ?? 1) }, () => a),
  );

  const forfaitaires = developpes.filter(
    (a) => a.lettreCle === "BSA" || a.lettreCle === "BSB" || a.lettreCle === "BSC",
  );
  if (forfaitaires.length > 0) {
    justification.push(
      "Forfait de prise en charge quotidienne (BSI) : il inclut l'ensemble des soins de la journée relevant du forfait.",
    );
    if (developpes.length > forfaitaires.length) {
      alertes.push(
        "Des actes hors forfait sont associés à un forfait BSI. Vérifiez qu'ils sont bien cumulables (article 12).",
      );
    }
  }

  const valorises = developpes
    .map((a) => ({
      acte: a,
      brut: arrondi(a.coefficient * (t[a.lettreCle] ?? 0)),
    }))
    .sort((x, y) => y.brut - x.brut);

  let rangCumulable = 0;
  const lignes: LigneCotation[] = valorises.map(({ acte, brut }) => {
    if (acte.horsRegleCumul || forfaitaires.length > 0) {
      return {
        code: acte.code,
        libelle: acte.libelle,
        lettreCle: acte.lettreCle,
        coefficient: acte.coefficient,
        quantite: 1,
        taux: 100,
        montant: brut,
        motifTaux: acte.horsRegleCumul
          ? "Acte facturable à taux plein (dérogation à la règle de cumul)"
          : "Forfait journalier",
      };
    }
    rangCumulable += 1;
    const taux = rangCumulable === 1 ? 100 : rangCumulable === 2 ? 50 : 0;
    const motifTaux =
      rangCumulable === 1
        ? "Acte le plus coûteux : taux plein"
        : rangCumulable === 2
          ? "Deuxième acte : 50 % (article 11B des dispositions générales)"
          : "Au-delà du deuxième acte : non facturable (article 11B)";
    return {
      code: acte.code,
      libelle: acte.libelle,
      lettreCle: acte.lettreCle,
      coefficient: acte.coefficient,
      quantite: 1,
      taux,
      montant: arrondi((brut * taux) / 100),
      motifTaux,
    };
  });

  if (rangCumulable >= 2) {
    justification.push(
      "Règle de non-cumul (article 11B) : l'acte le plus coûteux est facturé à 100 %, le deuxième à 50 %, les suivants ne sont pas facturables.",
    );
  }
  if (rangCumulable > 2) {
    alertes.push(
      `${rangCumulable - 2} acte(s) ne sont pas facturables du fait de la règle de non-cumul. Vérifiez si une dérogation s'applique.`,
    );
  }

  const majorations: LigneMajoration[] = [];
  const nuit = estNuit(contexte.heure);
  if (nuit === "nuit_profonde") {
    majorations.push({ code: "MN", libelle: "Majoration de nuit profonde (23h-5h)", montant: t.MNP });
  } else if (nuit === "nuit") {
    majorations.push({ code: "MN", libelle: "Majoration de nuit (20h-23h / 5h-8h)", montant: t.MN });
  }
  if (contexte.dimancheOuFerie) {
    majorations.push({ code: "MD", libelle: "Majoration dimanche et jours fériés", montant: t.MD });
  }
  if (contexte.jeuneEnfant) {
    majorations.push({ code: "MIE", libelle: "Majoration jeune enfant (moins de 7 ans)", montant: t.MIE });
  }

  const acteUnique = rangCumulable === 1 && forfaitaires.length === 0;
  if (contexte.coordinationInfirmiere) {
    majorations.push({ code: "MCI", libelle: "Majoration de coordination infirmière", montant: t.MCI });
    justification.push("La MCI n'est pas cumulable avec la MAU : seule la MCI a été retenue.");
  } else if (acteUnique && contexte.aDomicile) {
    majorations.push({ code: "MAU", libelle: "Majoration d'acte unique", montant: t.MAU });
    justification.push("Acte unique au domicile : majoration MAU appliquée.");
  }

  const deplacement: LigneMajoration[] = [];
  if (contexte.aDomicile) {
    deplacement.push({ code: "IFD", libelle: "Indemnité forfaitaire de déplacement", montant: t.IFD });
    const distance = contexte.distanceKm ?? 0;
    const kmIndemnises = Math.max(0, distance * 2 - t.IK_abattement_km);
    if (kmIndemnises > 0) {
      const tarifIK = contexte.zone === "montagne" ? t.IK_montagne : t.IK_plaine;
      deplacement.push({
        code: contexte.zone === "montagne" ? "IKM" : "IK",
        libelle: `Indemnités kilométriques — ${kmIndemnises.toFixed(1)} km indemnisés (aller-retour, abattement de ${t.IK_abattement_km} km)`,
        montant: arrondi(kmIndemnises * tarifIK),
      });
    }
  }

  const totalActes = arrondi(lignes.reduce((s, l) => s + l.montant, 0));
  const totalMajorations = arrondi(majorations.reduce((s, m) => s + m.montant, 0));
  const totalDeplacement = arrondi(deplacement.reduce((s, m) => s + m.montant, 0));

  return {
    lignes,
    majorations,
    deplacement,
    totalActes,
    totalMajorations,
    totalDeplacement,
    total: arrondi(totalActes + totalMajorations + totalDeplacement),
    justification,
    alertes,
  };
}

export const euros = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
