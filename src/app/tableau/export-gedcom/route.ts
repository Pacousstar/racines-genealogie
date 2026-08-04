import { createClient } from "@/lib/supabase/server";
import {
  genererGedcom,
  type GedcomPersonne,
  type GedcomLien,
  type GedcomUnion,
} from "@/lib/gedcom";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const [personnesRes, liensRes, unionsRes] = await Promise.all([
    supabase
      .from("personnes")
      .select(
        "id,nom,prenom,surnom,sexe,date_naissance,date_deces,vivant,source"
      )
      .order("nom"),
    supabase.from("enfants").select("parent_id,enfant_id"),
    supabase.from("unions").select("conjoint_1,conjoint_2,date_union"),
  ]);

  const gedcom = genererGedcom(
    (personnesRes.data ?? []) as GedcomPersonne[],
    (liensRes.data ?? []) as GedcomLien[],
    (unionsRes.data ?? []) as GedcomUnion[]
  );

  return new Response(gedcom, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="genealogie-toa-zeo.ged"',
    },
  });
}
