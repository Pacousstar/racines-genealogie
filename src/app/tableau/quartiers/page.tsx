import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import GestionQuartiers, {
  type QuartierGestion,
} from "./gestion-quartiers";
import Logo from "@/components/branding/logo";

export const metadata: Metadata = { title: "Quartiers de Toa-Zéo" };
export const dynamic = "force-dynamic";

export default async function QuartiersPage() {
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

  const { data: quartiers } = await supabase
    .from("quartiers")
    .select("id,nom,ordre")
    .order("ordre");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Logo />
        <Link
          href="/tableau"
          className="inline-flex items-center gap-1.5 text-sm font-medium opacity-80 transition hover:opacity-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Retour au Grand Tableau
        </Link>
      </div>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <MapPinned className="h-6 w-6 text-amber-700" aria-hidden /> Quartiers
          de Toa-Zéo
        </h1>
        <p className="-mt-1 text-sm opacity-70">
          Les quartiers du village — renommer, réordonner, ajouter ou
          supprimer.
        </p>
      </div>

      {!estEditeur ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          La gestion des quartiers est réservée à l&apos;éditeur (le CHO) et à
          l&apos;admin. Votre compte est en lecture seule.
        </p>
      ) : (
        <GestionQuartiers quartiers={(quartiers ?? []) as QuartierGestion[]} />
      )}
    </main>
  );
}