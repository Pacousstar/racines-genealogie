import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const ligne of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = ligne.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data: personnes } = await supabase.from("personnes").select("*");
const { data: liens } = await supabase.from("enfants").select("*");
const { data: unions } = await supabase.from("unions").select("*");

// Même logique que src/lib/arbre.ts (construitArbre)
const estAncetre = (p) => p.est_ancetre === true || p.est_fondateur === true;
const nom = (id) => {
  const p = (personnes ?? []).find((x) => x.id === id);
  return p ? `${p.prenom ?? ""} ${p.nom}`.trim() : "?";
};
const anneeDe = (d) => (d ? (d.match(/\d{4}/) ?? [null])[0] : null);

const parId = new Map((personnes ?? []).map((p) => [p.id, p]));
const enfantsDe = new Map();
const parentsDe = new Map();
for (const l of liens ?? []) {
  if (!enfantsDe.has(l.parent_id)) enfantsDe.set(l.parent_id, new Map());
  enfantsDe.get(l.parent_id).set(l.enfant_id, l.rang ?? Number.MAX_SAFE_INTEGER);
  if (!parentsDe.has(l.enfant_id)) parentsDe.set(l.enfant_id, new Set());
  parentsDe.get(l.enfant_id).add(l.parent_id);
}
const declareDe = new Map();
for (const u of unions ?? []) {
  const r = u.rang ?? Number.MAX_SAFE_INTEGER;
  if (!declareDe.has(u.conjoint_1)) declareDe.set(u.conjoint_1, []);
  declareDe.get(u.conjoint_1).push({ id: u.conjoint_2, rang: r });
  if (!declareDe.has(u.conjoint_2)) declareDe.set(u.conjoint_2, []);
  declareDe.get(u.conjoint_2).push({ id: u.conjoint_1, rang: r });
}
for (const liste of declareDe.values()) {
  liste.sort((x, y) => x.rang - y.rang || x.id.localeCompare(y.id));
}
const infererPartenaires = (id) => {
  const deja = new Set((declareDe.get(id) ?? []).map((c) => c.id));
  const p = parId.get(id);
  if (!p) return [];
  const ids = [];
  for (const eid of enfantsDe.get(id)?.keys() ?? []) {
    for (const coparentId of parentsDe.get(eid) ?? []) {
      if (coparentId === id || deja.has(coparentId) || !parId.get(coparentId)) continue;
      if (ids.includes(coparentId)) continue;
      const cp = parId.get(coparentId);
      if (p.sexe && cp.sexe && p.sexe !== cp.sexe) ids.unshift(coparentId);
      else ids.push(coparentId);
    }
  }
  return ids;
};

const enfantsConnus = new Set();
for (const m of enfantsDe.values()) for (const id of m.keys()) enfantsConnus.add(id);

const racines = [...new Set(personnes ?? [])]
  .sort(
    (a, b) =>
      Number(estAncetre(b)) - Number(estAncetre(a)) || nom(a.id).localeCompare(nom(b.id))
  )
  .filter((p) => estAncetre(p) || !enfantsConnus.has(p.id));

const couverts = new Set();
const couvrir = (n) => {
  couverts.add(n.personne.id);
  if (n.conjoint) couverts.add(n.conjoint.id);
  for (const a of n.autresConjoints) couverts.add(a.conjoint.id);
  for (const e of n.enfants) couvrir(e);
  for (const a of n.autresConjoints) for (const e of a.enfants) couvrir(e);
};

const construire = (id, visite, profondeur) => {
  const p = parId.get(id);
  if (!p || visite.has(id) || profondeur > 40) return null;
  const nouveauVisite = new Set(visite);
  nouveauVisite.add(id);
  const partenairesIds = [
    ...(declareDe.get(id) ?? []).map((c) => c.id),
    ...infererPartenaires(id),
  ];
  const principalId = partenairesIds[0] ?? null;
  const conjoint = principalId ? parId.get(principalId) ?? null : null;
  if (conjoint) nouveauVisite.add(conjoint.id);
  const autresIds = partenairesIds.slice(1);
  const parCouple = new Map();
  const sansAutreParent = new Map();
  const parentsDeEnfant = (eid) => parentsDe.get(eid) ?? new Set();
  for (const [eid, rang] of enfantsDe.get(id) ?? []) {
    const generateur = partenairesIds.find((pid) => parentsDeEnfant(eid).has(pid));
    if (generateur) {
      if (!parCouple.has(generateur)) parCouple.set(generateur, new Map());
      parCouple.get(generateur).set(eid, rang);
    } else {
      sansAutreParent.set(eid, rang);
    }
  }
  const trier = (enfants) =>
    [...enfants]
      .map(([enfantId, rang]) => ({ enfant: parId.get(enfantId), rang }))
      .filter((x) => x.enfant)
      .sort(
        (a, b) =>
          a.rang - b.rang ||
          Number(anneeDe(a.enfant.date_naissance) ?? 99999) -
            Number(anneeDe(b.enfant.date_naissance) ?? 99999) ||
          nom(a.enfant.id).localeCompare(nom(b.enfant.id))
      )
      .map(({ enfant }) => construire(enfant.id, nouveauVisite, profondeur + 1))
      .filter(Boolean);
  const enfantsPrincipal = new Map(sansAutreParent);
  if (principalId && parCouple.has(principalId)) {
    for (const [eid, rang] of parCouple.get(principalId)) enfantsPrincipal.set(eid, rang);
  }
  const autresConjoints = [];
  for (const autreId of autresIds) {
    const autre = parId.get(autreId);
    if (!autre) continue;
    autresConjoints.push({
      conjoint: autre,
      enfants: parCouple.has(autreId) ? trier(parCouple.get(autreId)) : [],
    });
  }
  return {
    personne: p,
    conjoint,
    autresConjoints,
    enfants: trier(enfantsPrincipal),
    profondeur,
  };
};

const visiteGlobale = new Set();
const resultat = [];
for (const r of racines) {
  if (couverts.has(r.id)) continue;
  const n = construire(r.id, visiteGlobale, 0);
  if (n) {
    resultat.push(n);
    couvrir(n);
  }
}

const affiche = (n, prof) => {
  const ind = "  ".repeat(prof);
  const ligne = `${ind}${n.personne.prenom ?? ""} ${n.personne.nom}`.trim();
  const couples = [];
  if (n.conjoint) couples.push(nom(n.conjoint.id));
  for (const a of n.autresConjoints) couples.push(`+ ${nom(a.conjoint.id)}`);
  console.log(`${ligne}${couples.length ? ` ⚭ ${couples.join(" · ")}` : ""}`);
  for (const e of n.enfants) affiche(e, prof + 1);
  for (const a of n.autresConjoints) {
    for (const e of a.enfants) affiche(e, prof + 1);
  }
};

console.log("=== ARBRES AFFICHÉS (forêt complète) ===");
for (const r of resultat) affiche(r, 0);

// Vérifications ciblées
const verifie = (cond, msg) => console.log(`${cond ? "OK" : "PROBLÈME"} — ${msg}`);
console.log("\n=== VÉRIFICATIONS ===");
verifie(resultat.length === 1, `un seul arbre affiché (celui de KILA) — actuel : ${resultat.length}`);
const mehib = "e86d2da2-4e8a-4ce7-a70c-2afbad6a5cca";
const nccc = "9300ba85-c0ec-4c00-8c57-874ad2354484";
const nglom = "23adb0ac-882a-424b-840e-9b554a59f959";
verifie(resultat.every((r) => r.personne.id !== mehib && r.personne.id !== nccc && r.personne.id !== nglom), "les 3 femmes ne sont plus des arbres isolés à côté de KILA");
verifie((declareDe.get("bacd5fb4-145b-4d7d-972c-1f737b37d037") ?? []).some((c) => c.id === mehib), "Tahidi ⚭ Méhibomon Juliette");
verifie((declareDe.get("b1a760e9-9391-40f3-8819-a301c7c296c8") ?? []).some((c) => c.id === nccc), "Sobré ⚭ Nathalie CCC");
verifie((enfantsDe.get(mehib)?.has("85ddc930-3df1-43d0-894b-6339bed31d69") ?? false), "Méhibomon mère d'Alfred");
verifie((enfantsDe.get(mehib)?.has("6fb3ff14-9c96-43c0-9316-54b85e6c8463") ?? false), "Méhibomon mère d'Achille Pacôme");
verifie((enfantsDe.get(nccc)?.has("3f4c7e52-bf7e-471d-b5df-752c8dd8e53a") ?? false), "Nathalie CCC mère d'Arnaud");
verifie((enfantsDe.get(nglom)?.has("678c32a3-8081-4011-bccc-631b69aebd4c") ?? false), "Nathalie GNOMBLEROU mère de Christelle");
verifie((enfantsDe.get("c7d06608-7bbf-4d01-aae6-7bb8033adf27")?.has("6bcf93ce-dad6-42f4-80ee-fc5b6a67aa6d") ?? false), "A BBB BBB mère de DDD");