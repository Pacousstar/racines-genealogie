import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus, PencilLine, Trash2, Image, Save, History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NavigationBas from "@/components/mobile/navigation-bas";
import Logo from "@/components/branding/logo";

export const metadata: Metadata = { title: "Journal" };
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

type Entree = {
  id: string;
  action: string;
  cible_type: string;
  cible_id: string | null;
  detail: Record<string, unknown> | null;
  cree_le: string | null;
};

const LIBELLES: Record<string, { texte: string; Icone: typeof History }> = {
  declaration: { texte: "a ajouté une personne", Icone: UserPlus },
  modification: { texte: "a modifié une personne", Icone: PencilLine },
  suppression: { texte: "a supprimé une personne", Icone: Trash2 },
  photo: { texte: "a changé la photo d'une personne", Icone: Image },
  restauration: { texte: "a restauré une sauvegarde", Icone: Save },
};

export default async function JournalPage() {
  const supabase = await createClient();

  let brut: unknown = null;
  try {
    const res = await supabase
      .from("journal")
      .select("id,action,cible_type,cible_id,detail,cree_le")
      .order("cree_le", { ascending: false })
      .limit(100);
    brut = res.data;
  } catch {
    brut = null;
  }

  const entrees = (brut ?? []) as Entree[];

  const personneIds = [
    ...new Set(
      entrees
        .filter((e) => e.cible_type === "personne" && e.cible_id)
        .map((e) => e.cible_id as string)
    ),
  ];
  const { data: personnes } = personneIds.length
    ? await supabase.from("personnes").select("id,nom,prenom").in("id", personneIds)
    : { data: null };
  const parId = new Map(
    (personnes ?? []).map((p) => [
      p.id,
      [p.nom, p.prenom].filter(Boolean).join(" "),
    ])
  );

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="flex items-center gap-3 px-4 pt-4">
        <Logo />
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight text-white">Journal</h1>
          <p className="text-xs text-white/75">L&apos;historique des changements</p>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pt-5">
        {entrees.length === 0 ? (
          <p className="rounded-2xl bg-white/15 p-4 text-sm text-white/85">
            Aucune entrée pour l&apos;instant — les déclarations, modifications,
            suppressions et restaurations apparaîtront ici.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {entrees.map((e) => {
              const info = LIBELLES[e.action] ?? {
                texte: `a fait l'action « ${e.action} »`,
                Icone: History,
              };
              const Icone = info.Icone;
              const nom =
                e.cible_type === "personne" && e.cible_id
                  ? parId.get(e.cible_id)
                  : undefined;
              const detail =
                e.cible_type === "personne" && e.cible_id && nom === undefined
                  ? (e.detail as { nom?: string; prenom?: string } | null)
                  : null;
              const libelle = nom ?? (detail ? [detail.nom, detail.prenom].filter(Boolean).join(" ") : null);

              const contenu = (
                <>
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-900 text-white">
                    <Icone className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold leading-snug text-blue-900">
                      {info.texte}
                      {libelle ? ` : ${libelle}` : ""}
                    </span>
                    <span className="block pt-0.5 text-xs font-medium text-emerald-700">
                      {relatif(e.cree_le)}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={e.id}>
                  {e.cible_type === "personne" && e.cible_id ? (
                    <Link
                      href={`/tableau/personnes/${e.cible_id}`}
                      className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm transition active:scale-[0.99]"
                    >
                      {contenu}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                      {contenu}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </main>

      <NavigationBas />
    </div>
  );
}