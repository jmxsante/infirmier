import { describe, expect, it } from "vitest";
import {
  lignesDepuisCotation,
  numeroFacture,
  periodeDe,
  prochaineSequence,
  repartir,
  statutApresPaiement,
} from "./facturation";

describe("répartition AMO / AMC / patient", () => {
  it("applique 60/40 au régime général sans mutuelle", () => {
    const r = repartir(100);
    expect(r.amo).toBe(60);
    expect(r.amc).toBe(0);
    expect(r.patient).toBe(40);
  });

  it("bascule le ticket modérateur sur la mutuelle quand elle existe", () => {
    const r = repartir(100, { mutuelle: true });
    expect(r.amo).toBe(60);
    expect(r.amc).toBe(40);
    expect(r.patient).toBe(0);
  });

  it("prend en charge à 100 % en ALD", () => {
    const r = repartir(87.4, { ald: true });
    expect(r.amo).toBeCloseTo(87.4, 2);
    expect(r.patient).toBe(0);
    expect(r.explication).toMatch(/ALD/);
  });

  it("traite l'exonération du ticket modérateur comme une prise en charge intégrale", () => {
    const r = repartir(50, { exoneration: "maternité" });
    expect(r.tauxAmo).toBe(1);
    expect(r.amo).toBe(50);
  });

  it("ne répartit jamais un montant négatif et reste équilibrée", () => {
    const r = repartir(-10);
    expect(r.total).toBe(0);
    const s = repartir(33.33, { mutuelle: true });
    expect(s.amo + s.amc + s.patient).toBeCloseTo(s.total, 2);
  });
});

describe("numérotation des factures", () => {
  it("formate sur quatre chiffres", () => {
    expect(numeroFacture(2026, 7)).toBe("2026-0007");
  });

  it("reprend la séquence à partir des numéros existants de l'année", () => {
    expect(prochaineSequence(["2026-0001", "2026-0012", "2025-0099"], 2026)).toBe(13);
    expect(prochaineSequence([], 2026)).toBe(1);
    expect(prochaineSequence(["2025-0004"], 2026)).toBe(1);
  });
});

const cotation = {
  id: "c1",
  intervention_id: "i1",
  calcule_le: "2026-03-04T07:12:00.000Z",
  total: 20,
  lignes: [
    { code: "AMI1", libelle: "Pansement", coefficient: 1.5, taux: 100, montant: 4.73 },
    { code: "AMI2", libelle: "Injection", coefficient: 1, taux: 0, montant: 0 },
  ],
  majorations: [{ code: "MAU", libelle: "Acte unique", montant: 1.35 }],
  deplacement: [{ code: "IFD", libelle: "Déplacement", montant: 2.75 }],
};

describe("transformation d'une cotation en lignes de facture", () => {
  it("aplatit actes, majorations et déplacement et écarte les lignes à zéro", () => {
    const l = lignesDepuisCotation(cotation);
    expect(l.map((x) => x.code)).toEqual(["AMI1", "MAU", "IFD"]);
    expect(l.every((x) => x.date_acte === "2026-03-04")).toBe(true);
    expect(l[1]!.taux).toBe(100);
    expect(l[1]!.coefficient).toBe(1);
  });

  it("tolère des colonnes jsonb vides", () => {
    expect(lignesDepuisCotation({ ...cotation, lignes: null, majorations: 0, deplacement: {} })).toEqual(
      [],
    );
  });

  it("calcule les bornes de période", () => {
    const p = periodeDe([cotation, { ...cotation, calcule_le: "2026-03-01T18:00:00.000Z" }]);
    expect(p).toEqual({ debut: "2026-03-01", fin: "2026-03-04" });
  });
});

describe("statut déduit des encaissements", () => {
  it("passe à payée au solde complet, partielle sinon", () => {
    expect(statutApresPaiement(100, 100, "envoyee")).toBe("payee");
    expect(statutApresPaiement(100, 99.995, "envoyee")).toBe("payee");
    expect(statutApresPaiement(100, 40, "envoyee")).toBe("partielle");
    expect(statutApresPaiement(100, 0, "envoyee")).toBe("envoyee");
  });

  it("ne réécrit pas un litige ni une annulation", () => {
    expect(statutApresPaiement(100, 100, "litige")).toBe("litige");
    expect(statutApresPaiement(100, 100, "annulee")).toBe("annulee");
  });
});
