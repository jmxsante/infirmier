import { describe, expect, it } from "vitest";
import { calculerCotation, TARIFS_PAR_DEFAUT, type ActeACoter } from "./ngap";

const t = TARIFS_PAR_DEFAUT;

function acte(partiel: Partial<ActeACoter> & { code: string }): ActeACoter {
  return {
    id: partiel.code,
    libelle: partiel.libelle ?? partiel.code,
    lettreCle: partiel.lettreCle ?? "AMI",
    coefficient: partiel.coefficient ?? 1,
    ...partiel,
  } as ActeACoter;
}

describe("moteur de cotation NGAP", () => {
  it("facture un acte unique à taux plein", () => {
    const r = calculerCotation([acte({ code: "AMI1", coefficient: 1.5 })], { aDomicile: false });
    expect(r.lignes).toHaveLength(1);
    expect(r.lignes[0]!.taux).toBe(100);
    expect(r.lignes[0]!.montant).toBeCloseTo(1.5 * t.AMI, 2);
    expect(r.total).toBeCloseTo(1.5 * t.AMI, 2);
  });

  it("applique l'article 11B : 100 % / 50 % / 0 %", () => {
    const r = calculerCotation(
      [
        acte({ code: "A", coefficient: 1 }),
        acte({ code: "B", coefficient: 4 }),
        acte({ code: "C", coefficient: 2 }),
      ],
      { aDomicile: false },
    );
    expect(r.lignes.map((l) => l.coefficient)).toEqual([4, 2, 1]);
    expect(r.lignes.map((l) => l.taux)).toEqual([100, 50, 0]);
    expect(r.lignes[2]!.montant).toBe(0);
    expect(r.alertes.join(" ")).toMatch(/non-cumul/);
  });

  it("laisse un acte dérogatoire à taux plein sans consommer le rang de cumul", () => {
    const r = calculerCotation(
      [
        acte({ code: "PERF", coefficient: 10, horsRegleCumul: true }),
        acte({ code: "AMI1", coefficient: 1.5 }),
      ],
      { aDomicile: false },
    );
    const perf = r.lignes.find((l) => l.code === "PERF")!;
    const ami = r.lignes.find((l) => l.code === "AMI1")!;
    expect(perf.taux).toBe(100);
    expect(ami.taux).toBe(100);
  });

  it("bascule tous les actes à taux plein en présence d'un forfait BSI et alerte sur le hors-forfait", () => {
    const r = calculerCotation(
      [
        acte({ code: "BSB", lettreCle: "BSB", coefficient: 1 }),
        acte({ code: "AMI1", coefficient: 1.5 }),
      ],
      { aDomicile: true },
    );
    expect(r.lignes.every((l) => l.taux === 100)).toBe(true);
    expect(r.alertes.join(" ")).toMatch(/hors forfait/);
    // Pas de MAU : la présence d'un forfait annule la notion d'acte unique.
    expect(r.majorations.find((m) => m.code === "MAU")).toBeUndefined();
  });

  it("développe les quantités en lignes distinctes", () => {
    const r = calculerCotation([acte({ code: "AMI1", coefficient: 1, quantite: 3 })], {
      aDomicile: false,
    });
    expect(r.lignes).toHaveLength(3);
    expect(r.lignes.map((l) => l.taux)).toEqual([100, 50, 0]);
  });

  it("applique la majoration de nuit profonde entre 23h et 5h", () => {
    expect(
      calculerCotation([acte({ code: "A" })], { aDomicile: true, heure: "23:30" }).majorations.some(
        (m) => m.montant === t.MNP,
      ),
    ).toBe(true);
    expect(
      calculerCotation([acte({ code: "A" })], { aDomicile: true, heure: "06:00" }).majorations.some(
        (m) => m.montant === t.MN,
      ),
    ).toBe(true);
    expect(
      calculerCotation([acte({ code: "A" })], { aDomicile: true, heure: "10:00" }).majorations.some(
        (m) => m.code === "MN",
      ),
    ).toBe(false);
  });

  it("retient la MCI et exclut la MAU quand la coordination s'applique", () => {
    const r = calculerCotation([acte({ code: "A" })], {
      aDomicile: true,
      coordinationInfirmiere: true,
    });
    expect(r.majorations.map((m) => m.code)).toContain("MCI");
    expect(r.majorations.map((m) => m.code)).not.toContain("MAU");
    expect(r.justification.join(" ")).toMatch(/MCI/);
  });

  it("cumule dimanche et jeune enfant", () => {
    const r = calculerCotation([acte({ code: "A" })], {
      aDomicile: true,
      dimancheOuFerie: true,
      jeuneEnfant: true,
    });
    const codes = r.majorations.map((m) => m.code);
    expect(codes).toContain("MD");
    expect(codes).toContain("MIE");
  });

  it("calcule l'IFD et les IK aller-retour avec abattement", () => {
    const r = calculerCotation([acte({ code: "A" })], {
      aDomicile: true,
      distanceKm: 10,
      zone: "plaine",
    });
    const ifd = r.deplacement.find((d) => d.code === "IFD")!;
    const ik = r.deplacement.find((d) => d.code === "IK")!;
    expect(ifd.montant).toBe(t.IFD);
    // 10 km aller → 20 km AR − 4 km d'abattement = 16 km indemnisés
    expect(ik.montant).toBeCloseTo(16 * t.IK_plaine, 2);
  });

  it("n'indemnise pas les kilomètres sous le seuil d'abattement", () => {
    const r = calculerCotation([acte({ code: "A" })], { aDomicile: true, distanceKm: 1 });
    expect(r.deplacement.find((d) => d.code === "IK")).toBeUndefined();
    expect(r.totalDeplacement).toBe(t.IFD);
  });

  it("applique le tarif montagne quand la zone l'exige", () => {
    const r = calculerCotation([acte({ code: "A" })], {
      aDomicile: true,
      distanceKm: 10,
      zone: "montagne",
    });
    expect(r.deplacement.find((d) => d.code === "IKM")!.montant).toBeCloseTo(16 * t.IK_montagne, 2);
  });

  it("n'ajoute aucun déplacement au cabinet", () => {
    const r = calculerCotation([acte({ code: "A" })], { aDomicile: false, distanceKm: 30 });
    expect(r.deplacement).toHaveLength(0);
    expect(r.totalDeplacement).toBe(0);
  });

  it("totalise actes + majorations + déplacement", () => {
    const r = calculerCotation([acte({ code: "A", coefficient: 2 })], {
      aDomicile: true,
      distanceKm: 5,
      dimancheOuFerie: true,
    });
    expect(r.total).toBeCloseTo(r.totalActes + r.totalMajorations + r.totalDeplacement, 2);
    expect(r.total).toBeGreaterThan(0);
  });

  it("accepte des tarifs de cabinet personnalisés", () => {
    const r = calculerCotation([acte({ code: "A", coefficient: 1 })], {
      aDomicile: false,
      tarifs: { ...t, AMI: 4 },
    });
    expect(r.lignes[0]!.montant).toBe(4);
  });
});
