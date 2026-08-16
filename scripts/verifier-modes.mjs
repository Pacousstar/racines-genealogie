import { createClient } from "@supabase/supabase-js";
import {
  construitArbre,
  prunerArbre,
  descendantsDe,
  ascendantsDe,
  clipperGenerations,
} from "../src/lib/arbre.ts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data: personnes } = await supabase.from("personnes").select("*");
const { data: liens } = await supabase.from("enfants").select("parent_id,enfant_id,rang");
const { data: unions } = await supabase.from("unions").select("conjoint_1,conjoint_2,date_union,rang");

const parId = new Map((personnes ?? []).map((p) => [p.id, p]));
const nom = (id) => {
  const p = parId.get(id);
  return p ? `${p.prenom ?? ""} ${p.nom}`.trim() : id;
};

const arbre = construitArbre(personnes ?? [], liens ?? [], unions ?? []);

const lister = (noeuds) => {
  const sortis = [];
  const marcher = (n) => {
    sortis.push(nom(n.personne.id));
    if (n.conjoint) sortis.push(`⚭ ${nom(n.conjoint.id)}`);
    for (const a of n.autresConjoints) {
      sortis.push(`⚭ ${nom(a.conjoint.id)}`);
      for (const e of a.enfants) marcher(e);
    }
    for (const e of n.enfants) marcher(e);
  };
  for (const n of noeuds) marcher(n);
  return sortis;
};

const modeId = (personnes ?? []).find((p) => p.prenom?.includes("Tahidi"))?.id;

console.log("=== FORÊT COMPLÈTE ===");
console.log(lister(arbre).join(" | "));

console.log("\n=== DESCENDANCE de Tahidi ===");
const desc = descendantsDe(modeId, liens ?? []);
const descMatch = (p) => p.id === modeId || desc.has(p.id);
console.log(lister(arbre.map((r) => prunerArbre(r, descMatch)).filter(Boolean)).join(" | "));

console.log("\n=== ASCENDANCE de Tahidi ===");
const asc = ascendantsDe(modeId, liens ?? []);
const ascMatch = (p) => p.id === modeId || asc.has(p.id);
console.log(lister(arbre.map((r) => prunerArbre(r, ascMatch)).filter(Boolean)).join(" | "));

console.log("\n=== FORÊT, 2 GÉNÉRATIONS ===");
console.log(lister(arbre.map((n) => clipperGenerations(n, 1))).join(" | "));

console.log("\n=== FORÊT, 3 GÉNÉRATIONS ===");
console.log(lister(arbre.map((n) => clipperGenerations(n, 2))).join(" | "));