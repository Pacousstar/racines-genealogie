import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  LifeBuoy,
  FileQuestion,
  Hourglass,
  UserX,
  CalendarX2,
  PencilLine,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { nomComplet, initiales, periode } from "@/lib/arbre";
import Logo from "@/components/branding/logo";
import {
  COULEURS_QUARTIERS,
  type CouleurQuartier,
  PUCES_BORDURE,
  TINTE,
} from "@/lib/couleurs-quartiers";

export const metadata: Metadata = { title: "Aides à la reconstitution" };
export const dynamic = "force-dynamic";

type Ligne = {
  id: string;
  nom: string;
  prenom: string | null;
  sexe: string | null;
  vivant: boolean | null;
  date_naissance: string | null;
  date_deces: string | null;
  fiabilite: string | null;
  quartier_id: string | null;
  famille_id: string | null;
  est_ancetre: boolean | null;
  est_fondateur: boolean | null;
};

function estProvisoire(p: Ligne): boolean {
  return /inconn/i.test(p.nom);
}

function Encart({
  titre,
  icone,
  description,
  accent,
  enfants,
}: {
  titre: string;
  icone: React.ReactNode;
  description: string;
  accent: string;
  enfants: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-current/10 bg-white p-5">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          {icone}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight">{titre}</h2>
          <p className="text-xs opacity-70">{description}</p>
        </div>
      </div>
      {enfants}
    </section>
  );
}

function LigneCarte({
  p,
  quartierNom,
  couleur,
}: {
  p: Ligne;
  quartierNom: string;
  couleur: CouleurQuartier | null;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-current/10 bg-white p-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${
          p.sexe === "F" ? "bg-rose-700" : "bg-emerald-800"
        }`}
        aria-hidden
      >
        {initiales(p)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
          {nomComplet(p)}
          {estProvisoire(p) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-600/15 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              <FileQuestion className="h-3 w-3" aria-hidden /> pointillés
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs opacity-70">
          <span>
            {p.sexe === "M" ? "♂" : p.sexe === "F" ? "♀" : ""} {periode(p)}
          </span>
          {quartierNom && (
            <span
              className={`inline-flex items-center gap-1 rounded-full border ${couleur ? PUCES_BORDURE[couleur] : "border-current/30"}`}
              style={couleur ? { backgroundColor: TINTE[couleur] } : undefined}
            >
              {quartierNom}
            </span>
          )}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link
          href={`/tableau/personnes/${p.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-current/5"
        >
          <UserRound className="h-3.5 w-3.5" aria-hidden /> Fiche
        </Link>
        <Link
          href={`/tableau/personnes/${p.id}/modifier`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800"
        >
          <PencilLine className="h-3.5 w-3.5" aria-hidden /> Compléter
        </Link>
      </div>
    </div>
  );
}

export default async function AidesPage() {
  const supabase = await createClient();

  const [personnesRes, liensRes, quartiersRes] = await Promise.all([
    supabase
      .from("personnes")
      .select(
        "id,nom,prenom,sexe,vivant,date_naissance,date_deces,fiabilite,quartier_id,famille_id,est_ancetre,est_fondateur"
      )
      .order("nom"),
    supabase.from("enfants").select("parent_id,enfant_id"),
    supabase.from("quartiers").select("id,nom").order("ordre"),
  ]);

  const personnes = (personnesRes.data ?? []) as Ligne[];
  const liens = (liensRes.data ?? []) as { parent_id: string; enfant_id: string }[];
  const quartiers = (quartiersRes.data ?? []) as { id: string; nom: string }[];

  const quartierNom = new Map(quartiers.map((q) => [q.id, q.nom]));
  const couleurById = (id: string | null): CouleurQuartier | null => {
    if (!id) return null;
    const index = quartiers.findIndex((q) => q.id === id);
    return index >= 0 ? COULEURS_QUARTIERS[index % COULEURS_QUARTIERS.length] : null;
  };

  const enfantsConnus = new Set(liens.map((l) => l.enfant_id));
  const parentsDe = new Map<string, string[]>();
  for (const l of liens) {
    const liste = parentsDe.get(l.enfant_id) ?? [];
    liste.push(l.parent_id);
    parentsDe.set(l.enfant_id, liste);
  }

  const provisoires = personnes.filter(estProvisoire);
  const provisoiresIds = new Set(provisoires.map((p) => p.id));

  const enAttente = personnes.filter(
    (p) => p.fiabilite === "en cours" && !estProvisoire(p)
  );

  const orphelins = personnes.filter(
    (p) =>
      !enfantsConnus.has(p.id) &&
      !provisoiresIds.has(p.id) &&
      p.est_ancetre !== true &&
      p.est_fondateur !== true
  );

  const sansDate = personnes.filter(
    (p) =>
      p.vivant === true &&
      !p.date_naissance &&
      !provisoiresIds.has(p.id)
  );

  const unParent = personnes.filter(
    (p) =>
      (parentsDe.get(p.id)?.length ?? 0) === 1 &&
      !provisoiresIds.has(p.id)
  );

  const icones = [
    {
      titre: "Cartes provisoires",
      icone: <FileQuestion className="h-5 w-5" aria-hidden />,
      description:
        "« Père/Mère inconnu » créés lors d'une déclaration à compléter — reliez-les à leur famille.",
      accent: "bg-amber-600/15 text-amber-800",
      liste: provisoires,
    },
    {
      titre: "Attente de confirmation",
      icone: <Hourglass className="h-5 w-5" aria-hidden />,
      description: "Personnes dont la fiabilité est encore « en cours ».",
      accent: "bg-sky-600/15 text-sky-800",
      liste: enAttente,
    },
    {
      titre: "Orphelins — sans parents connus",
      icone: <UserX className="h-5 w-5" aria-hidden />,
      description:
        "Personnes non reliées à un parent ni à un ancêtre ; à rattacher si possible.",
      accent: "bg-rose-600/15 text-rose-800",
      liste: orphelins,
    },
    {
      titre: "Vivants sans date de naissance",
      icone: <CalendarX2 className="h-5 w-5" aria-hidden />,
      description: "Repères temporels manquants ; renseigner la date si connue.",
      accent: "bg-orange-600/15 text-orange-800",
      liste: sansDate,
    },
    {
      titre: "Un seul parent connu",
      icone: <PencilLine className="h-5 w-5" aria-hidden />,
      description: "Personnes reliées à un seul de leurs parents.",
      accent: "bg-violet-600/15 text-violet-800",
      liste: unParent,
    },
  ];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Logo />
        <Link
          href="/tableau"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/85 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Retour au Grand Tableau
        </Link>
      </div>

      <div className="text-white">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <LifeBuoy className="h-6 w-6 text-emerald-300" aria-hidden /> Aides à la
          reconstitution
        </h1>
        <p className="-mt-1 text-sm text-white/85">
          Les chantiers à compléter pour renforcer la généalogie — cliquez sur
          « Compléter » pour ouvrir le formulaire.
        </p>
      </div>

      {icones.map(({ titre, icone, description, accent, liste }) => (
        <Encart
          key={titre}
          titre={`${titre} (${liste.length})`}
          icone={icone}
          description={description}
          accent={accent}
          enfants={
            liste.length === 0 ? (
              <p className="mt-3 text-sm text-emerald-700">
                ✓ Rien à faire — tout est relié.
              </p>
            ) : (
              liste.map((p) => (
                <LigneCarte
                  key={p.id}
                  p={p}
                  quartierNom={quartierNom.get(p.quartier_id ?? "") ?? ""}
                  couleur={couleurById(p.quartier_id)}
                />
              ))
            )
          }
        />
      ))}
    </main>
  );
}