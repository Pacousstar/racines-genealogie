import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users, Network, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NavigationBas from "@/components/mobile/navigation-bas";
import Logo from "@/components/branding/logo";
import { nomComplet, periode, libelleFamille } from "@/lib/arbre";

export const metadata: Metadata = { title: "Recherche" };
export const dynamic = "force-dynamic";

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { q } = await searchParams;
  const terme = (q ?? "").trim();
  const si = terme.replace(/[%_]/g, "");

  const [personnesRes, famillesRes, quartiersRes] = await Promise.all([
    si
      ? supabase
          .from("personnes")
          .select("id,nom,prenom,surnom,sexe,date_naissance,date_deces,vivant,famille_id,quartier_id")
          .or(`nom.ilike.%${si}%,prenom.ilike.%${si}%,surnom.ilike.%${si}%`)
          .order("nom")
          .limit(30)
      : Promise.resolve({ data: null }),
    si
      ? supabase.from("familles").select("id,nom,quartier_id").ilike("nom", `%${si}%`).limit(20)
      : Promise.resolve({ data: null }),
    si
      ? supabase.from("quartiers").select("id,nom").ilike("nom", `%${si}%`).limit(20)
      : Promise.resolve({ data: null }),
  ]);

  const personnes = personnesRes.data ?? [];
  const familles = famillesRes.data ?? [];
  const quartiers = quartiersRes.data ?? [];

  const [membresParFamille, quartiersParId] = await Promise.all([
    familles.length > 0
      ? supabase.from("personnes").select("famille_id").in("famille_id", familles.map((f) => f.id))
      : Promise.resolve({ data: [] }),
    familles.length > 0 || quartiers.length > 0
      ? supabase.from("quartiers").select("id,nom")
      : Promise.resolve({ data: [] }),
  ]);

  const compteFamille = new Map<string, number>();
  for (const p of membresParFamille.data ?? []) {
    compteFamille.set(p.famille_id, (compteFamille.get(p.famille_id) ?? 0) + 1);
  }
  const quartierNom = new Map((quartiersParId.data ?? []).map((x) => [x.id, x.nom]));
  const total = personnes.length + familles.length + quartiers.length;

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="flex items-center gap-3 px-4 pt-4">
        <Logo />
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight text-white">Recherche</h1>
          <p className="text-xs text-white/75">Dans toute la généalogie</p>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pt-5">
        <form action="/recherche" method="get" className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={terme}
            autoFocus
            placeholder="Rechercher dans Racines+…"
            className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-11 pr-4 text-base shadow-sm outline-none focus:border-emerald-600"
          />
        </form>

        {terme && (
          <p className="mt-3 text-sm text-white/80">
            {total > 0 ? (
              <>
                {total} résultat{total > 1 ? "s" : ""} pour « {terme} »
              </>
            ) : (
              <>Aucun résultat pour « {terme} »</>
            )}
          </p>
        )}

        {personnes.length > 0 && (
          <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-500">
              <Users className="h-4 w-4" aria-hidden /> Personnes ({personnes.length})
            </h2>
            <ul className="divide-y divide-neutral-100">
              {personnes.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/tableau/personnes/${p.id}`}
                    className="flex items-center justify-between gap-2 py-2.5 transition active:bg-emerald-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold text-blue-900">
                        {nomComplet(p)}
                      </span>
                      <span className="block text-xs text-neutral-500">
                        {p.sexe === "M" ? "♂" : p.sexe === "F" ? "♀" : ""} {periode(p)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-emerald-700">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {familles.length > 0 && (
          <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-500">
              <Network className="h-4 w-4" aria-hidden /> Familles ({familles.length})
            </h2>
            <ul className="divide-y divide-neutral-100">
              {familles.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-base font-semibold text-blue-900">
                      {libelleFamille(f.nom)}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {f.quartier_id ? quartierNom.get(f.quartier_id) ?? "" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-emerald-700/10 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    {compteFamille.get(f.id) ?? 0} membre
                    {(compteFamille.get(f.id) ?? 0) > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {quartiers.length > 0 && (
          <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-500">
              <MapPin className="h-4 w-4" aria-hidden /> Quartiers ({quartiers.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {quartiers.map((x) => (
                <span
                  key={x.id}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium"
                >
                  {x.nom}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>

      <NavigationBas />
    </div>
  );
}