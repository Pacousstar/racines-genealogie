import { readFileSync } from "node:fs";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.trim().match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/[\r"']/g, "").trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const rep = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  },
});
if (!rep.ok) {
  console.error("OpenAPI indisponible :", rep.status, rep.statusText);
  process.exit(1);
}
const spec = await rep.json();
const defs = spec.definitions ?? spec.components?.schemas ?? {};
const personnes = defs.personnes ?? defs.Personnes;
if (!personnes) {
  console.error("Schéma personnes introuvable");
  process.exit(1);
}
const proprietes = Object.keys(personnes.properties ?? {});
const nouvelles = ["retraite", "residence", "crise_2010_2011"];
console.log("Colonnes personnes :", proprietes.sort().join(", "));
for (const c of nouvelles) {
  console.log(`${c} : ${proprietes.includes(c) ? "PRÉSENTE" : "ABSENTE"}`);
}