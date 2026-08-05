import { describe, expect, it } from "vitest";
import {
  alerteOrdonnance,
  cheminStockage,
  couvreLaPeriode,
  joursRestants,
  nomFichierSur,
  poidsLisible,
  statutEffectif,
  verifierFichier,
} from "./ordonnances";

const AUJ = "2026-03-10";

describe("validité d'une ordonnance", () => {
  it("compte les jours restants et gère l'absence de terme", () => {
    expect(joursRestants("2026-03-20", AUJ)).toBe(10);
    expect(joursRestants("2026-03-01", AUJ)).toBe(-9);
    expect(joursRestants(null, AUJ)).toBeNull();
  });

  it("déclare expirée une ordonnance dont la date de fin est passée, même marquée valide", () => {
    expect(statutEffectif({ statut: "valide", date_fin: "2026-03-09" }, AUJ)).toBe("expiree");
    expect(statutEffectif({ statut: "valide", date_fin: "2026-03-10" }, AUJ)).toBe("valide");
    expect(statutEffectif({ statut: "valide", date_fin: null }, AUJ)).toBe("valide");
  });

  it("respecte les statuts décidés par le soignant", () => {
    expect(statutEffectif({ statut: "annulee", date_fin: "2026-12-31" }, AUJ)).toBe("annulee");
    expect(statutEffectif({ statut: "a_recuperer", date_fin: "2026-12-31" }, AUJ)).toBe(
      "a_recuperer",
    );
  });
});

describe("alertes du dossier", () => {
  it("priorise la récupération et l'expiration", () => {
    expect(alerteOrdonnance({ statut: "a_recuperer" }, AUJ)?.niveau).toBe("urgent");
    expect(alerteOrdonnance({ statut: "valide", date_fin: "2026-01-01" }, AUJ)?.niveau).toBe(
      "urgent",
    );
  });

  it("signale l'absence de justificatif scanné", () => {
    expect(
      alerteOrdonnance({ statut: "valide", date_fin: "2026-12-31" }, AUJ)?.message,
    ).toMatch(/justificatif/);
  });

  it("prévient quatorze jours avant l'échéance", () => {
    const a = alerteOrdonnance(
      { statut: "valide", date_fin: "2026-03-17", fichier_path: "x.pdf" },
      AUJ,
    );
    expect(a).toEqual({ niveau: "attention", message: "Expire dans 7 jours." });
    expect(
      alerteOrdonnance({ statut: "valide", date_fin: "2026-03-10", fichier_path: "x.pdf" }, AUJ)
        ?.message,
    ).toBe("Dernier jour de validité.");
    expect(
      alerteOrdonnance({ statut: "valide", date_fin: "2026-06-30", fichier_path: "x.pdf" }, AUJ),
    ).toBeNull();
  });

  it("reste muette sur une ordonnance annulée", () => {
    expect(alerteOrdonnance({ statut: "annulee" }, AUJ)).toBeNull();
  });
});

describe("couverture d'un plan de soins", () => {
  it("exige que la période du plan tienne dans celle de l'ordonnance", () => {
    const o = { statut: "valide" as const, date_debut: "2026-03-01", date_fin: "2026-04-30" };
    expect(couvreLaPeriode(o, "2026-03-05", "2026-04-30")).toBe(true);
    expect(couvreLaPeriode(o, "2026-02-25", "2026-04-01")).toBe(false);
    expect(couvreLaPeriode(o, "2026-03-05", "2026-05-01")).toBe(false);
    expect(couvreLaPeriode(o, "2026-03-05", null)).toBe(false);
  });

  it("couvre indéfiniment une ordonnance sans terme, jamais une ordonnance à récupérer", () => {
    expect(couvreLaPeriode({ statut: "valide", date_fin: null }, "2026-03-05", null)).toBe(true);
    expect(couvreLaPeriode({ statut: "a_recuperer" }, "2026-03-05", "2026-03-06")).toBe(false);
  });
});

describe("dépôt de fichiers", () => {
  it("neutralise les noms de fichiers hostiles", () => {
    expect(nomFichierSur("../../étage 3/ordonnance n°2.pdf")).toBe("etage-3-ordonnance-n-2.pdf");
    expect(nomFichierSur("...")).toBe("document");
  });

  it("préfixe toujours le chemin par le cabinet puis le patient", () => {
    expect(cheminStockage("cab", "pat", "scan.pdf", 42)).toBe("cab/pat/42-scan.pdf");
  });

  it("refuse le vide, le trop lourd et les formats inconnus", () => {
    expect(verifierFichier({ name: "a.pdf", size: 0, type: "application/pdf" })).toMatch(/vide/);
    expect(
      verifierFichier({ name: "a.pdf", size: 20 * 1024 * 1024, type: "application/pdf" }),
    ).toMatch(/lourd/);
    expect(verifierFichier({ name: "a.exe", size: 10, type: "application/x-msdownload" })).toMatch(
      /Format/,
    );
    expect(verifierFichier({ name: "a.pdf", size: 1024, type: "application/pdf" })).toBeNull();
  });

  it("affiche un poids lisible", () => {
    expect(poidsLisible(0)).toBe("—");
    expect(poidsLisible(900)).toBe("900 o");
    expect(poidsLisible(2048)).toBe("2 Ko");
    expect(poidsLisible(3 * 1024 * 1024)).toBe("3.0 Mo");
  });
});
