import type { Metadata } from "next";
import Link from "next/link";
import { Trees, FilePenLine, Search, Mic, Users, MapPin, HeartHandshake } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NavigationBas from "@/components/mobile/navigation-bas";
import Logo from "@/components/branding/logo";

export const metadata: Metadata = { title: "Accueil" };
export const dynamic = "force-dynamic";

const ACTIONS = [
  {
    href: "/tableau/declarer",
    label: "Déclarer une personne",
    detail: "Ajouter quelqu'un à la généalogie",
    Icon: FilePenLine,
  },
  {
    href: "/recherche",
    label: "Rechercher",
    detail: "Personnes, familles, quartiers",
    Icon: Search,
  },
  {
    href: "/temoignage",
    label: "Témoignage audio",
    detail: "Enregistrer un récit de famille",
    Icon: Mic,
  },
];

export default async function AccueilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ count: personnes }, { count: familles }, { count: quartiers }] =
    await Promise.all([
      supabase.from("personnes").select("id", { count: "exact", head: true }),
      supabase.from("familles").select("id", { count: "exact", head: true }),
      supabase.from("quartiers").select("id", { count: "exact", head: true }),
    ]);

  const prenom =
    (user?.user_metadata?.prenom as string | undefined) ??
    (user?.email ?? "").split("@")[0] ??
    "";

  const stats = [
    { label: "Personnes", valeur: personnes ?? 0, Icon: Users },
    { label: "Familles", valeur: familles ?? 0, Icon: HeartHandshake },
    { label: "Quartiers", valeur: quartiers ?? 0, Icon: MapPin },
  ];

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="flex items-center gap-3 px-4 pt-4">
        <Logo />
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight text-white">
            Racines+ · Toa-Zéo
          </h1>
          <p className="truncate text-xs text-white/75">{user?.email}</p>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 pt-8">
        <div>
          <p className="text-sm text-white/80">Bonjour</p>
          <h2 className="text-3xl font-bold text-white">
            {prenom ? `${prenom[0].toUpperCase()}${prenom.slice(1)}` : "Bienvenue"} 👋
          </h2>
          <p className="mt-1 text-sm text-white/85">
            Votre famille vous attend — la généalogie de la famille DIHI se
            construit ici.
          </p>
        </div>

        <Link
          href="/tableau"
          className="flex flex-col gap-1 rounded-2xl bg-white p-5 shadow-lg transition active:scale-[0.99]"
        >
          <span className="flex items-center gap-2 text-lg font-bold text-emerald-800">
            <Trees className="h-6 w-6 text-emerald-700" aria-hidden />
            MON ARBRE
          </span>
          <span className="text-sm text-neutral-600">
            Explorer ma famille — parents, enfants, unions
          </span>
        </Link>

        <section className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
            Actions rapides
          </h3>
          <div className="flex flex-col gap-2">
            {ACTIONS.map(({ href, label, detail, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm transition active:scale-[0.99]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold text-blue-900">
                    {label}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">
                    {detail}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          {stats.map(({ label, valeur, Icon }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-xl bg-white/15 py-3 text-white"
            >
              <Icon className="h-5 w-5 text-emerald-200" aria-hidden />
              <span className="text-xl font-bold">{valeur}</span>
              <span className="text-[11px] uppercase tracking-wide text-white/75">
                {label}
              </span>
            </div>
          ))}
        </section>
      </main>

      <NavigationBas />
    </div>
  );
}