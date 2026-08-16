import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const TAHIDI_VRAI = "bacd5fb4-145b-4d7d-972c-1f737b37d037";
const TAHIDI_DOUBLON = "d27dab4b-1762-4c83-bf58-da06715ce007";
const GLOU_VRAIE = "e86d2da2-4e8a-4ce7-a70c-2afbad6a5cca";
const GLOU_DOUBLON = "532ecebe-0158-4cc2-897d-0da58852e42c";

const { data: ghisele } = await supabase
  .from("personnes")
  .select("id")
  .in("id", ["5e2b72b4-2799-469e-9c53-944bd7ee9e52", "9f094aa6-a40c-4022-afdd-306ebfb9db40"]);
const idsGhisele = (ghisele ?? []).map((g) => g.id);

const { data: unions } = await supabase.from("unions").select("conjoint_1,conjoint_2");
const unionGhisele = (unions ?? []).find(
  (u) => idsGhisele.includes(u.conjoint_1) || idsGhisele.includes(u.conjoint_2)
);
const ghiseleGarde = unionGhisele
  ? idsGhisele.find((id) => id === unionGhisele.conjoint_1 || id === unionGhisele.conjoint_2)
  : idsGhisele[0];
const ghiseleDoublon = idsGhisele.find((id) => id !== ghiseleGarde);

console.log("Ghisele gardée :", ghiseleGarde);
console.log("Ghisele doublon :", ghiseleDoublon);

const etape = async (nom, fn) => {
  const res = await fn();
  if (res.error) {
    console.error("ÉCHEC", nom, res.error.message);
    process.exit(1);
  }
  console.log("OK", nom, res.count ?? res.data?.length ?? "");
};

await etape("rediriger Alfred -> Tahidi vrai", () =>
  supabase.from("enfants").update({ parent_id: TAHIDI_VRAI }).eq("parent_id", TAHIDI_DOUBLON)
);
await etape("rediriger Alfred -> GLOU vraie", () =>
  supabase.from("enfants").update({ parent_id: GLOU_VRAIE }).eq("parent_id", GLOU_DOUBLON)
);
await etape("rediriger les liens vers Ghisele gardée (enfants)", () =>
  supabase.from("enfants").update({ parent_id: ghiseleGarde }).eq("parent_id", ghiseleDoublon)
);
await etape("rediriger l'union vers Ghisele gardée", async () => {
  const u = await supabase.from("unions").update({ conjoint_1: ghiseleGarde }).eq("conjoint_1", ghiseleDoublon);
  const v = await supabase.from("unions").update({ conjoint_2: ghiseleGarde }).eq("conjoint_2", ghiseleDoublon);
  return u.error ?? v.error ?? { count: 0 };
});

await etape("supprimer Tahidi Dénis (doublon)", () =>
  supabase.from("personnes").delete().eq("id", TAHIDI_DOUBLON)
);
await etape("supprimer GLOU (doublon)", () =>
  supabase.from("personnes").delete().eq("id", GLOU_DOUBLON)
);
await etape("supprimer Ghisele (doublon)", () =>
  supabase.from("personnes").delete().eq("id", ghiseleDoublon)
);

console.log("\nNettoyage terminé.");