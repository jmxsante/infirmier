import { describe, expect, it } from "vitest";
import {
  cellule,
  csvFactures,
  csvRecettes,
  nombreFr,
  nomExport,
  totauxExercice,
  versCsv,
  type FactureComptable,
  type RecetteComptable,
} from "./comptabilite";

describe("formatage CSV français", () => {
  it("écrit les décimales à la virgule sur deux chiffres", () => {
    expect(nombreFr(1234.5)).toBe("1234,50");
    expect(nombreFr(0)).toBe("0,00");
    expect(nombreFr(Number.NaN)).toBe("0,00");
  });

  it("échappe les cellules contenant un point-virgule ou un guillemet", () => {
    expect(cellule("Dupont; Jean")).toBe('"Dupont; Jean"');
    expect(cellule('Le "petit"')).toBe('"Le ""petit"""');
    expect(cellule(null)).toBe("");
  });

  it("préfixe le fichier d'un BOM UTF-8 et sépare par des points-virgules", () => {
    const csv = versCsv(["A", "B"], [["1", "2"]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("A;B\r\n1;2");
  });
});

const facture: FactureComptable = {
  numero: "2026-0001",
  patient: "Jean Dupont",
  periode_debut: "2026-03-01",
  periode_fin: "2026-03-31",
  statut: "partielle",
  total: 120,
  montant_paye: 72,
  part_amo: 72,
  part_amc: 0,
  part_patient: 48,
  date_envoi: "2026-04-01",
  date_paiement: null,
};

describe("journal des factures", () => {
  it("calcule le reste dû et conserve les parts", () => {
    const lignes = csvFactures([facture]).trim().split("\r\n");
    expect(lignes).toHaveLength(2);
    expect(lignes[1]).toContain("120,00;72,00;0,00;48,00;72,00;48,00");
  });
});

const recettes: RecetteComptable[] = [
  { date_paiement: "2026-04-10", numero: "2026-0002", patient: "B", source: "virement", montant: 30 },
  { date_paiement: "2026-01-05", numero: "2026-0001", patient: "A", source: "cheque", montant: 72.5 },
  { date_paiement: "2025-12-20", numero: "2025-0009", patient: "C", source: "espèces", montant: 10 },
];

describe("livre de recettes", () => {
  it("trie par date et clôt sur le total encaissé", () => {
    const lignes = csvRecettes(recettes).trim().split("\r\n");
    expect(lignes[1]).toContain("2025-12-20");
    expect(lignes[3]).toContain("2026-04-10");
    expect(lignes[4]).toContain("Total encaissé;112,50");
  });

  it("agrège les totaux d'un exercice donné", () => {
    expect(totauxExercice(recettes, 2026)).toEqual({ annee: 2026, encaisse: 102.5, nombre: 2 });
    expect(totauxExercice(recettes, 2024)).toEqual({ annee: 2024, encaisse: 0, nombre: 0 });
  });

  it("nomme le fichier par exercice", () => {
    expect(nomExport("livre-recettes", 2026)).toBe("livre-recettes-2026.csv");
  });
});
