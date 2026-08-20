import { createClient } from "@/lib/supabase/server";
import { createClientServiceRole } from "@/lib/service-role";
import SauvegardeClient from "./sauvegarde-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sauvegarde" };
export const dynamic = "force-dynamic";

export default async function SauvegardePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let comptes = {
    personnes: 0,
    liens: 0,
    unions: 0,
    quartiers: 0,
    familles: 0,
    temoignages: 0,
  };

  try {
    const admin = createClientServiceRole();
    const table = async (nom: string) => {
      const { count } = await admin
        .from(nom)
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    };
    const [personnes, liens, unions, quartiers, familles, temoignages] =
      await Promise.all([
        table("personnes"),
        table("enfants"),
        table("unions"),
        table("quartiers"),
        table("familles"),
        table("temoignages"),
      ]);
    comptes = { personnes, liens, unions, quartiers, familles, temoignages };
  } catch {
    // Clé service role non configurée ici : compteurs à zéro, la page
    // d'export donnera une explication claire.
  }

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="flex items-center gap-3 px-4 pt-4">
        <h1 className="text-xl font-bold text-white">Sauvegarde</h1>
      </header>
      <main className="mx-auto max-w-xl px-4 pt-5">
        <SauvegardeClient
          courriel={user?.email ?? null}
          comptes={comptes}
        />
      </main>
    </div>
  );
}