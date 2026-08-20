import type { Metadata } from "next";
import Link from "next/link";
import { UserX, HeartCrack, Sprout } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NavigationBas from "@/components/mobile/navigation-bas";
import Logo from "@/components/branding/logo";
import { nomComplet, periode, estAncetre } from "@/lib/arbre";
import type { Personne } from "@/lib/arbre";

export const metadata: Metadata = { title: "À relier" };
export const dynamic = "force-dynamic";

type Section = {
  icone: "sans-parents" | "sans-union" | "sans-enfants";
  titre: string;
  explication: string;
  personnes: Personne[];
};

export default async function ARelierPage() {
  const supabase = await createClient();

  const [personnesRes, liensRes, unionsRes] = await Promise.all([
    supabase.from("personnes").select("*").order("nom"),
    supabase.from("enfants").select("parent_id,enfant_id"),
    supabase.from("unions").select("conjoint_1,conjoint_2"),
  ]);

  const personnes = (personnesRes.data ?? []) as Personne[];
  const liens = liensRes.data ?? [];
  const unions = unionsRes.data ?? [];

  const sansParents = new Set(
    personnes.map((p) => p.id).filter((id) => !liens.some((l) => l.enfant_id === id))
  );
  const avecUnion = new Set<string>();
  for (const u of unions) {
    avecUnion.add(u.conjoint_1);
    avecUnion.add(u.conjoint_2);
  }
  const sansEnfants = new Set(
    personnes.map((p) => p.id).filter((id) => !liens.some((l) => l.parent_id === id))
  );

  const sections: Section[] = [
    {
      icone: "sans-parents",
      titre: "Sans parents déclarés",
      explication:
        "Reliez leur père et leur mère (fiche → Modifier → Parents) pour qu'ils prennent leur place dans l'arbre.",
      personnes: personnes.filter((p) => sansParents.has(p.id)),
    },
    {
      icone: "sans-union",
      titre: "Sans conjoint déclaré",
      explication:
        "Si la personne est mariée ou a eu des enfants, déclarez le conjoint (fiche → Modifier → Conjoint(e)s).",
      personnes: personnes.filter((p) => !avecUnion.has(p.id)),
    },
    {
      icone: "sans-enfants",
      titre: "Sans enfants déclarés",
      explication:
        "Si la personne a des enfants, ajoutez-les (fiche → Modifier → Enfants).",
      personnes: personnes.filter((p) => !sansEnfants.has(p.id)),
    },
  ];

  const icones = {
    "sans-parents": UserX,
    "sans-union": HeartCrack,
    "sans-enfants": Sprout,
  };

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="flex items-center gap-3 px-4 pt-4">
        <Logo />
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight text-white">À relier</h1>
          <p className="text-xs text-white/75">
            Ce qui reste à compléter pour que l&apos;arbre soit complet
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 pt-5">
        {sections.map((s) => {
          const Icone = icones[s.icone];
          return (
            <section
              key={s.icone}
              className="rounded-2xl bg-white p-4 shadow-sm"
            >
              <h2 className="flex items-center gap-2 text-base font-bold text-blue-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Icone className="h-4.5 w-4.5" aria-hidden />
                </span>
                {s.titre}
                <span className="rounded-full bg-emerald-700/10 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  {s.personnes.length}
                </span>
              </h2>
              <p className="mt-1 text-xs text-neutral-500">{s.explication}</p>

              {s.personnes.length === 0 ? (
                <p className="mt-3 rounded-xl bg-emerald-700/10 px-3 py-2 text-sm font-medium text-emerald-800">
                  Tout est relié ✓
                </p>
              ) : (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {s.personnes.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/tableau/personnes/${p.id}`}
                        className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 transition hover:border-emerald-600/50 hover:bg-emerald-50 active:scale-[0.99]"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            estAncetre(p)
                              ? "bg-amber-500 text-white"
                              : "bg-emerald-800 text-white"
                          }`}
                          aria-hidden
                        >
                          {p.prenom?.charAt(0) ?? ""}
                          {p.nom.charAt(0)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-base font-semibold text-blue-900">
                            {nomComplet(p)}
                            {estAncetre(p) ? " ★" : ""}
                          </span>
                          <span className="block truncate text-xs text-neutral-500">
                            {periode(p)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </main>

      <NavigationBas />
    </div>
  );
}