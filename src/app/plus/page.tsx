import type { Metadata } from "next";
import Link from "next/link";
import {
  Map,
  MapPinned,
  LifeBuoy,
  Download,
  FilePenLine,
  Printer,
  LogOut,
  Mic,
  Search,
  Trees,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NavigationBas from "@/components/mobile/navigation-bas";
import Logo from "@/components/branding/logo";
import { logout } from "@/app/tableau/actions";

export const metadata: Metadata = { title: "Plus" };
export const dynamic = "force-dynamic";

export default async function PlusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const liens = [
    { href: "/tableau", label: "Mon arbre", detail: "La vue Famille proche", Icon: Trees },
    { href: "/recherche", label: "Recherche", detail: "Personnes, familles, quartiers", Icon: Search },
    { href: "/temoignage", label: "Témoignage audio", detail: "Enregistrer un récit de famille", Icon: Mic },
    { href: "/tableau/declarer", label: "Déclarer une personne", detail: "Ajouter à la généalogie", Icon: FilePenLine },
    { href: "/tableau/carte", label: "Carte du village", detail: "Les quartiers de Toa-Zéo", Icon: Map },
    { href: "/tableau/quartiers", label: "Quartiers", detail: "Gérer les quartiers", Icon: MapPinned },
    { href: "/tableau/aides", label: "Aides", detail: "Reconstitution de l'arbre", Icon: LifeBuoy },
    { href: "/tableau/exporter", label: "Exporter", detail: "GEDCOM, PDF", Icon: Download },
    { href: "/tableau/imprimer", label: "Imprimer", detail: "Version imprimable", Icon: Printer },
  ];

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="flex items-center gap-3 px-4 pt-4">
        <Logo />
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight text-white">Plus</h1>
          <p className="truncate text-xs text-white/75">{user?.email}</p>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pt-5">
        <ul className="flex flex-col gap-2">
          {liens.map(({ href, label, detail, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm transition active:scale-[0.99]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold text-blue-900">{label}</span>
                  <span className="block truncate text-xs text-neutral-500">{detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <form action={logout} className="mt-5">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/60 bg-red-600/15 px-4 py-3.5 text-base font-semibold text-red-100 transition active:scale-[0.99]"
          >
            <LogOut className="h-5 w-5" aria-hidden /> Se déconnecter
          </button>
        </form>
      </main>

      <NavigationBas />
    </div>
  );
}