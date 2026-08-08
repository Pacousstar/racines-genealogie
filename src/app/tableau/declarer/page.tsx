import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import FormulaireDeclaration from "@/components/saisie/formulaire-declaration";
import Logo from "@/components/branding/logo";

export const metadata: Metadata = { title: "Déclarer une personne" };
export const dynamic = "force-dynamic";

export default async function DeclarerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const role = profil?.role;
  const estEditeur = role === "editeur" || role === "admin";

  if (!estEditeur) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          La saisie est réservée à l&apos;éditeur (le CHO) et à l&apos;admin.
          Votre compte est en lecture seule.
        </p>
      </main>
    );
  }

  const [quartiersRes, famillesRes] = await Promise.all([
    supabase.from("quartiers").select("id,nom").order("ordre"),
    supabase.from("familles").select("id,nom,quartier_id").order("nom"),
  ]);

  return (
    <main className="fond-dynamique min-h-dvh p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <Logo />
          <Link
            href="/tableau"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Retour au tableau
          </Link>
        </div>

        <h1 className="mt-3 mb-1 text-2xl font-bold text-white">
          + Déclarer une personne
        </h1>
        <p className="mb-6 text-sm text-white/85">
          Remplissez le minimum (nom), le reste au besoin — le CHO complète au fur et à
          mesure.
        </p>

        <FormulaireDeclaration
          options={{
            quartiers: quartiersRes.data ?? [],
            familles: (famillesRes.data ?? []) as {
              id: string;
              nom: string;
              quartier_id: string | null;
            }[],
          }}
        />
      </div>
    </main>
  );
}