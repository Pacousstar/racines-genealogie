import { NextResponse } from "next/server";
import { createClient as createSupabase } from "@/lib/supabase/server";
import { createClientServiceRole } from "@/lib/service-role";

export const dynamic = "force-dynamic";

const TABLES = [
  "personnes",
  "enfants",
  "unions",
  "quartiers",
  "familles",
  "temoignages",
  "journal",
] as const;

export async function GET() {
  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erreur: "Non connecté." }, { status: 401 });
  }
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (prof?.role !== "editeur" && prof?.role !== "admin") {
    return NextResponse.json({ erreur: "Réservé à l'éditeur." }, { status: 403 });
  }

  const admin = createClientServiceRole();

  const donnees: Record<string, unknown[]> = {};
  const erreurs: string[] = [];
  try {
    for (const table of TABLES) {
      const { data, error } = await admin.from(table).select("*").order("id");
      if (error) {
        if (/does not exist|could not find/i.test(error.message)) {
          donnees[table] = [];
          continue;
        }
        erreurs.push(`${table}: ${error.message}`);
        continue;
      }
      donnees[table] = data ?? [];
    }
  } catch (e) {
    return NextResponse.json(
      {
        erreur:
          "La clé SUPABASE_SERVICE_ROLE_KEY n'est pas configurée sur ce serveur — l'export est indisponible ici. Configurez-la dans les variables d'environnement de Vercel.",
      },
      { status: 500 }
    );
  }

  const date = new Date().toISOString();
  const sauvegarde = {
    application: "racines-plus-toa-zeo",
    version: 1,
    cree_le: date,
    par: user.email ?? user.id,
    erreurs,
    donnees,
  };

  return new NextResponse(JSON.stringify(sauvegarde, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="racines-toa-zeo-${date.slice(0, 10)}.json"`,
    },
  });
}