import type { Metadata } from "next";
import Link from "next/link";
import { Users, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NavigationBas from "@/components/mobile/navigation-bas";
import Logo from "@/components/branding/logo";
import { nomComplet, periode, libelleFamille } from "@/lib/arbre";

export const metadata: Metadata = { title: "Familles" };
export const dynamic = "force-dynamic";

export default async function FamillePage() {
  const supabase = await createClient();

  const [famillesRes, personnesRes, quartiersRes] = await Promise.all([
    supabase.from("familles").select("id,nom,quartier_id").order("nom"),
    supabase
      .from("personnes")
      .select("id,nom,prenom,sexe,date_naissance,date_deces,vivant,famille_id")
      .order("nom"),
    supabase.from("quartiers").select("id,nom"),
  ]);

  const familles = famillesRes.data ?? [];
  const personnes = personnesRes.data ?? [];
  const quartierNom = new Map((quartiersRes.data ?? []).map((x) => [x.id, x.nom]));
  const membresParFamille = new Map<string, typeof personnes>();
  const sansFamille: typeof personnes = [];
  for (const p of personnes) {
    if (p.famille_id) {
      if (!membresParFamille.has(p.famille_id)) membresParFamille.set(p.famille_id, []);
      membresParFamille.get(p.famille_id)!.push(p);
    } else {
      sansFamille.push(p);
    }
  }

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="flex items-center gap-3 px-4 pt-4">
        <Logo />
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight text-white">Familles</h1>
          <p className="text-xs text-white/75">
            {familles.length} famille{familles.length > 1 ? "s" : ""} ·{" "}
            {personnes.length} personnes
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-5">
        {familles.map((f) => {
          const membres = membresParFamille.get(f.id) ?? [];
          return (
            <section key={f.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-blue-900">
                <Users className="h-5 w-5 text-emerald-700" aria-hidden />
                {libelleFamille(f.nom)}
              </h2>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {f.quartier_id ? quartierNom.get(f.quartier_id) ?? "Quartier inconnu" : "Sans quartier"}
              </p>
              {membres.length > 0 ? (
                <ul className="mt-2 divide-y divide-neutral-100">
                  {membres.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/tableau/personnes/${p.id}`}
                        className="flex items-center justify-between gap-2 py-2 transition active:bg-emerald-50"
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
              ) : (
                <p className="mt-2 text-sm text-neutral-500">
                  Aucun membre déclaré pour l&apos;instant.
                </p>
              )}
            </section>
          );
        })}

        {sansFamille.length > 0 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-blue-900">Sans famille</h2>
            <ul className="mt-2 divide-y divide-neutral-100">
              {sansFamille.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/tableau/personnes/${p.id}`}
                    className="flex items-center justify-between gap-2 py-2 transition active:bg-emerald-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold text-blue-900">
                        {nomComplet(p)}
                      </span>
                      <span className="block text-xs text-neutral-500">{periode(p)}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-emerald-700">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <NavigationBas />
    </div>
  );
}