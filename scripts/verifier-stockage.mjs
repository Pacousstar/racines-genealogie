import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.trim().match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/[\r"']/g, "").trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: buckets, error } = await supabase.storage.listBuckets();
if (error) {
  console.log("Liste buckets — ERREUR :", error.message);
} else {
  console.log("Buckets existants :", buckets.map((b) => `${b.name} (${b.public ? "public" : "privé"})`).join(", "));
  const photos = buckets.find((b) => b.name === "photos");
  if (!photos) {
    console.log("⚠️  Bucket « photos » ABSENT — à créer dans Storage.");
  } else {
    console.log("Bucket photos :", JSON.stringify({ public: photos.public }));
    const { data: racine, error: e2 } = await supabase.storage
      .from("photos")
      .list("");
    console.log("Test lecture racine :", e2 ? "ERREUR " + e2.message : `OK (${(racine ?? []).length} éléments)`);
    const { data: pub, error: e3 } = await supabase.storage
      .from("photos")
      .list("public");
    console.log("Dossier public/ :", e3 ? "ERREUR " + e3.message : `OK (${(pub ?? []).length} éléments)`);
  }
}