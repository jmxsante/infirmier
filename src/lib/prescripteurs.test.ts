import { describe, expect, it } from "vitest";
import {
  correspond,
  nomAffiche,
  normaliserRpps,
  rppsValide,
  trierPrescripteurs,
} from "./prescripteurs";

describe("carnet de prescripteurs", () => {
  it("compose un nom affichable", () => {
    expect(nomAffiche({ civilite: "Dr", nom: "Meunier", prenom: "Claire" })).toBe(
      "Dr Claire Meunier",
    );
    expect(nomAffiche({ civilite: "Autre", nom: "Meunier" })).toBe("Meunier");
  });

  it("normalise et valide le RPPS", () => {
    expect(normaliserRpps("10 100 456 789")).toBe("10100456789");
    expect(normaliserRpps("1234567890123")).toBe("12345678901");
    expect(rppsValide("")).toBe(true);
    expect(rppsValide("10100456789")).toBe(true);
    expect(rppsValide("123")).toBe(false);
  });

  it("recherche sans tenir compte des accents ni de l'ordre des mots", () => {
    const p = { nom: "Méunier", prenom: "Claire", specialite: "Gériatre", ville: "Échirolles" };
    expect(correspond(p, "meunier geriatre")).toBe(true);
    expect(correspond(p, "echirolles claire")).toBe(true);
    expect(correspond(p, "cardiologue")).toBe(false);
    expect(correspond(p, "  ")).toBe(true);
  });

  it("trie par nom puis prénom", () => {
    const t = trierPrescripteurs([
      { nom: "Bernard", prenom: "Zoé" },
      { nom: "Alard", prenom: "Yves" },
      { nom: "Bernard", prenom: "Alice" },
    ]);
    expect(t.map((x) => `${x.nom} ${x.prenom}`)).toEqual([
      "Alard Yves",
      "Bernard Alice",
      "Bernard Zoé",
    ]);
  });
});
