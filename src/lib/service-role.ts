import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

export function chargerEnvLocal(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    for (const ligne of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = ligne.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // Pas de fichier local (déploiement) : on utilise les variables d'environnement.
  }
  for (const [cle, valeur] of Object.entries(process.env)) {
    if (valeur) env[cle] = valeur;
  }
  return env;
}

export function createClientServiceRole() {
  const env = chargerEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY non configurée.");
  }
  return createClient(url, cle, { auth: { persistSession: false } });
}