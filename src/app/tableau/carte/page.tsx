import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CarteVillage from "@/components/arbre/carte-village";
import Logo from "@/components/branding/logo";
import {
  COULEURS_QUARTIERS,
  type CouleurQuartier,
  PUCES_BORDURE,
  TINTE,
} from "@/lib/couleurs-quartiers";

export const metadata: Metadata = { title: "Carte du village" };
export const dynamic = "force-dynamic";

export default async function CartePage() {
  const supabase = await createClient();
  const [quartiersRes, famillesRes, personnesRes] = await Promise.all([
    supabase.from("quartiers").select("id,nom").order("ordre"),
    supabase.from("familles").select("id,nom,quartier_id").order("nom"),
    supabase.from("personnes").select("quartier_id"),
  ]);

  const quartiers = (quartiersRes.data ?? []) as { id: string; nom: string }[];
  const familles = (famillesRes.data ?? []) as {
    id: string;
    nom: string;
    quartier_id: string | null;
  }[];
  const personnes = (personnesRes.data ?? []) as { quartier_id: string | null }[];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Logo />
        <Link
          href="/tableau"
          className="inline-flex items-center gap-1.5 text-sm font-medium opacity-80 transition hover:opacity-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Retour au Grand Tableau
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Map className="h-6 w-6 text-amber-700" aria-hidden /> Carte du
          village
        </h1>
        <span className="rounded-full border border-amber-700/40 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          Plan provisoire — positions à ajuster avec le plan de Toa-Zéo
        </span>
      </div>
      <p className="-mt-2 text-sm opacity-70">
        Chaque quartier est représenté avec ses familles et le nombre de
        personnes enregistrées. Les positions actuelles sont provisoires.
      </p>

      {quartiers.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-80">
          <span className="font-semibold uppercase tracking-wide opacity-60">
            Quartiers&nbsp;:
          </span>
          {quartiers.map((q, i) => {
            const c = COULEURS_QUARTIERS[i % COULEURS_QUARTIERS.length];
            return (
              <span key={q.id} className="inline-flex items-center gap-1.5">
                <span
                  className={`h-3 w-3 rounded-full border-2 ${PUCES_BORDURE[c as CouleurQuartier]}`}
                  style={{ backgroundColor: TINTE[c as CouleurQuartier] }}
                />
                {q.nom}
              </span>
            );
          })}
        </div>
      )}

      <CarteVillage
        quartiers={quartiers}
        familles={familles}
        personnes={personnes}
      />
    </main>
  );
}