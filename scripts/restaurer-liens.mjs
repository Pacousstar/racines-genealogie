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

const IDS = {
  kila: "f7449f39-22fb-4ea7-934b-be88aadf0a3f",
  zebagnon: "4dd7d5ca-e769-4485-92cd-260eb0f3252e",
  tahidi: "bacd5fb4-145b-4d7d-972c-1f737b37d037",
  mehibomon: "e86d2da2-4e8a-4ce7-a70c-2afbad6a5cca",
  sobre: "b1a760e9-9391-40f3-8819-a301c7c296c8",
  nathalieCcc: "9300ba85-c0ec-4c00-8c57-874ad2354484",
  nathalieGnomblerou: "23adb0ac-882a-424b-840e-9b554a59f959",
  alfred: "85ddc930-3df1-43d0-894b-6339bed31d69",
  achillePacome: "6fb3ff14-9c96-43c0-9316-54b85e6c8463",
  arnaud: "3f4c7e52-bf7e-471d-b5df-752c8dd8e53a",
  achilleChristelle: "678c32a3-8081-4011-bccc-631b69aebd4c",
  aBbb: "c7d06608-7bbf-4d01-aae6-7bb8033adf27",
  ddd: "6bcf93ce-dad6-42f4-80ee-fc5b6a67aa6d",
};

const nom = async (id) => {
  const { data } = await supabase.from("personnes").select("nom,prenom").eq("id", id).single();
  return data ? `${data.prenom ?? ""} ${data.nom}`.trim() : "?";
};

// Unions à créer (rang 0 = conjoint principal)
const unionsA = [
  { a: IDS.kila, b: IDS.zebagnon },
  { a: IDS.tahidi, b: IDS.mehibomon },
  { a: IDS.sobre, b: IDS.nathalieCcc },
];

// Liens parent -> enfant à créer
const enfantsA = [
  { parent: IDS.mehibomon, enfant: IDS.alfred, rang: 1 },
  { parent: IDS.mehibomon, enfant: IDS.achillePacome, rang: 2 },
  { parent: IDS.nathalieCcc, enfant: IDS.arnaud, rang: 1 },
  { parent: IDS.nathalieGnomblerou, enfant: IDS.achilleChristelle, rang: 2 },
  { parent: IDS.aBbb, enfant: IDS.ddd, rang: 2 },
];

const { data: unionsExistantes } = await supabase.from("unions").select("conjoint_1,conjoint_2");
const dejaUnion = new Set(
  (unionsExistantes ?? []).map((u) => [u.conjoint_1, u.conjoint_2].sort().join("|"))
);
const { data: liensExistants } = await supabase.from("enfants").select("parent_id,enfant_id");
const dejaLien = new Set((liensExistants ?? []).map((l) => `${l.parent_id}|${l.enfant_id}`));

let crees = 0;
for (const { a, b } of unionsA) {
  const cle = [a, b].sort().join("|");
  if (dejaUnion.has(cle)) {
    console.log(`Union déjà présente : ${await nom(a)} ⚭ ${await nom(b)}`);
    continue;
  }
  const { error } = await supabase.from("unions").insert({
    conjoint_1: a,
    conjoint_2: b,
    type: "mariage",
    rang: 0,
  });
  if (error) {
    console.log(`ERREUR union ${await nom(a)} ⚭ ${await nom(b)} : ${error.message}`);
  } else {
    console.log(`Union créée : ${await nom(a)} ⚭ ${await nom(b)}`);
    crees++;
  }
}

for (const { parent, enfant, rang } of enfantsA) {
  const cle = `${parent}|${enfant}`;
  if (dejaLien.has(cle)) {
    console.log(`Lien déjà présent : ${await nom(parent)} → ${await nom(enfant)}`);
    continue;
  }
  const { error } = await supabase.from("enfants").insert({ parent_id: parent, enfant_id: enfant, rang });
  if (error) {
    console.log(`ERREUR lien ${await nom(parent)} → ${await nom(enfant)} : ${error.message}`);
  } else {
    console.log(`Lien créé : ${await nom(parent)} → ${await nom(enfant)} (rang ${rang})`);
    crees++;
  }
}

console.log(`\n${crees} liens créés.`);