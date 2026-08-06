import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = {};
for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
  const m = ligne.trim().match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/[\r"']/g, "").trim();
}

const sup = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data: pers } = await sup
  .from("personnes")
  .select(
    "id,nom,prenom,sexe,vivant,date_naissance,date_deces,est_ancetre,est_fondateur,famille_id,quartier_id"
  )
  .order("nom");

console.log("-- PERSONNES --");
for (const p of pers ?? []) {
  console.log(
    `${p.nom} ${p.prenom ?? ""} | sexe=${p.sexe} | vivant=${p.vivant} | naissance=${p.date_naissance} | deces=${p.date_deces} | ancetre=${p.est_ancetre} | fondateur=${p.est_fondateur} | famille=${p.famille_id} | quartier=${p.quartier_id}`
  );
}

const q = await sup.from("familles").select("id,nom");
console.log("-- FAMILLES --", JSON.stringify(q.data));

const unions = await sup.from("unions").select("conjoint_1,conjoint_2,type,rang");
console.log("-- UNIONS --", JSON.stringify(unions.data));