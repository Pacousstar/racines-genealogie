import type { Metadata } from "next";
import Link from "next/link";
import { UserRound, HeartHandshake } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NavigationBas from "@/components/mobile/navigation-bas";
import Logo from "@/components/branding/logo";
import { nomComplet, periode } from "@/lib/arbre";

export const metadata: Metadata = { title: "Activités" };
export const dynamic = "force-dynamic";

function relatif(date: string | null): string {
  if (!date) return "";
  const d = new Date(date).getTime();
  if (Number.isNaN(d)) return "";
  const ecart = Date.now() - d;
  const min = Math.floor(ecart / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j < 30) return `il y a ${j} jour${j > 1 ? "s" : ""}`;
  const m = Math.floor(j / 30);
  if (m < 12) return `il y a ${m} mois`;
  return `il y a ${Math.floor(m / 12)} an${Math.floor(m / 12) > 1 ? "s" : ""}`;
}

export default async function ActivitesPage() {
  const supabase = await createClient();

  const [personnesRes, unionsRes] = await Promise.all([
    supabase
      .from("personnes")
      .select("id,nom,prenom,sexe,date_naissance,date_deces,vivant,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("unions")
      .select("conjoint_1,conjoint_2,date_union,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const personnes = personnesRes.data ?? [];
  const unions = unionsRes.data ?? [];

  const listeIds = [
    ...unions.flatMap((u) => [u.conjoint_1, u.conjoint_2]),
  ];
  const { data: lies } = listeIds.length
    ? await supabase
        .from("personnes")
        .select("id,nom,prenom,sexe,date_naissance,date_deces,vivant")
        .in("id", [...new Set(listeIds)])
    : { data: null };
  const parId = new Map((lies ?? []).map((p) => [p.id, p]));

  const evenements: {
    icone: "personne" | "union";
    texte: string;
    detail: string;
    quand: string | null;
    id: string | null;
  }[] = [
    ...personnes.map((p) => ({
      icone: "personne" as const,
      texte: `${nomComplet(p)} a été ajouté(e) à la généalogie`,
      detail: periode(p),
      quand: p.created_at,
      id: p.id,
    })),
    ...unions.map((u) => {
      const a = parId.get(u.conjoint_1);
      const b = parId.get(u.conjoint_2);
      return {
        icone: "union" as const,
        texte: `Nouvelle union : ${a ? nomComplet(a) : "?"} ⚭ ${b ? nomComplet(b) : "?"}`,
        detail: u.date_union ?? "",
        quand: u.created_at,
        id: a?.id ?? null,
      };
    }),
  ].sort((a, b) => (b.quand ?? "").localeCompare(a.quand ?? ""));

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="flex items-center gap-3 px-4 pt-4">
        <Logo />
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight text-white">Activités</h1>
          <p className="text-xs text-white/75">Les dernières contributions</p>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pt-5">
        {evenements.length === 0 ? (
          <p className="rounded-2xl bg-white/15 p-4 text-sm text-white/85">
            Rien pour l&apos;instant — les personnes ajoutées et les unions
            apparaîtront ici.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {evenements.map((e, i) => (
              <li key={i}>
                {e.id ? (
                  <Link
                    href={`/tableau/personnes/${e.id}`}
                    className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm transition active:scale-[0.99]"
                  >
                    {corps(e.icone, e.texte, e.detail, e.quand)}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    {corps(e.icone, e.texte, e.detail, e.quand)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      <NavigationBas />
    </div>
  );
}

function corps(
  icone: "personne" | "union",
  texte: string,
  detail: string,
  quand: string | null
) {
  return (
    <>
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
        {icone === "personne" ? (
          <UserRound className="h-5 w-5" aria-hidden />
        ) : (
          <HeartHandshake className="h-5 w-5" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-snug text-blue-900">
          {texte}
        </span>
        {detail && <span className="block text-xs text-neutral-500">{detail}</span>}
        <span className="block pt-0.5 text-xs font-medium text-emerald-700">
          {relatif(quand)}
        </span>
      </span>
    </>
  );
}