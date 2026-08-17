import { libelleFamille } from "../src/lib/arbre.ts";

const cas = [
  ["DIHI", "Famille DIHI"],
  ["Famille DIHI", "Famille DIHI"],
  ["famille DIHI", "famille DIHI"],
  ["", "Famille "],
];
let ok = true;
for (const [entree, attendu] of cas) {
  const obtenu = libelleFamille(entree);
  const valide = obtenu === attendu;
  if (!valide) ok = false;
  console.log(`${valide ? "✓" : "✗"} libelleFamille("${entree}") = "${obtenu}" (attendu "${attendu}")`);
}
console.log(ok ? "TOUT OK" : "ÉCHEC");
process.exit(ok ? 0 : 1);