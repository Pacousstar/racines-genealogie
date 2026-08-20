import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, Heart, Crown, Play, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ActionsFiche from "@/components/saisie/actions-fiche";
import ActionsFlottantes from "@/components/saisie/actions-flottantes";
import NavigationBas from "@/components/mobile/navigation-bas";
import Logo from "@/components/branding/logo";
import {
  initiales,
  nomComplet,
  periode,
  estAncetre,
  libelleFamille,
  type Personne,
} from "@/lib/arbre";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Fiche personne" };
export const dynamic = "force-dynamic";

const CHAMPS = [
  "id",
  "nom",
  "prenom",
  "surnom",
  "sexe",
  "date_naissance",
  "date_deces",
  "vivant",
  "quartier_id",
  "famille_id",
  "photo_url",
  "est_ancetre",
  "est_fondateur",
  "fiabilite",
  "source",
  "notes",
  "lieu_naissance",
  "lieu_deces",
  "biographie",
  "profession",
  "religion",
  "retraite",
  "residence",
  "crise_2010_2011",
] as const;

type PersonneFiche = Personne & {
  lieu_naissance: string | null;
  lieu_deces: string | null;
  biographie: string | null;
  profession: string | null;
  religion: string | null;
  retraite: boolean | null;
  residence: string | null;
  crise_2010_2011: boolean | null;
};

function LienPersonne({
  id,
  personne,
}: {
  id: string;
  personne: Personne | undefined;
}) {
  if (!personne) {
    return (
      <span className="rounded-lg border border-dashed border-current/25 px-3 py-2 text-sm opacity-70">
        Personne inconnue
      </span>
    );
  }
  return (
    <Link
      href={`/tableau/personnes/${id}`}
      className="rounded-lg border border-current/15 bg-white px-3 py-2 text-base font-medium transition hover:border-emerald-700"
    >
      {nomComplet(personne)} · {periode(personne)} ·{" "}
      {personne.sexe === "M" ? "♂" : "♀"}
    </Link>
  );
}

function Bloc({
  titre,
  vide,
  nombre,
  children,
}: {
  titre: string;
  vide: string;
  nombre: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-current/10 bg-white p-4">
      <h2 className="mb-2 font-semibold">{titre}</h2>
      {nombre > 0 ? (
        <div className="flex flex-wrap gap-2">{children}</div>
      ) : (
        <p className="text-sm opacity-60">{vide}</p>
      )}
    </section>
  );
}

export default async function FichePersonnePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: personne } = await (async () => {
    const essai = await supabase
      .from("personnes")
      .select(CHAMPS.join(","))
      .eq("id", id)
      .single();
    if (!essai.error) return essai;
    if (/column .* does not exist|could not find/i.test(essai.error.message)) {
      return supabase
        .from("personnes")
        .select(CHAMPS.filter((c) => !["profession", "religion"].includes(c)).join(","))
        .eq("id", id)
        .single();
    }
    return essai;
  })() as { data: PersonneFiche | null; error: unknown };

  if (!personne) notFound();

  const p = personne as unknown as PersonneFiche;

  const [quartierRes, familleRes, parentsRes, enfantsRes, unionsRes, temoignagesRes] =
    await Promise.all([
      p.quartier_id
        ? supabase.from("quartiers").select("nom").eq("id", p.quartier_id).single()
        : Promise.resolve<{ data: { nom: string } | null; error: unknown }>({
            data: null,
            error: null,
          }),
      p.famille_id
        ? supabase.from("familles").select("nom").eq("id", p.famille_id).single()
        : Promise.resolve<{ data: { nom: string } | null; error: unknown }>({
            data: null,
            error: null,
          }),
      supabase.from("enfants").select("parent_id").eq("enfant_id", id),
      supabase
        .from("enfants")
        .select("enfant_id,rang")
        .eq("parent_id", id)
        .order("rang"),
      supabase
        .from("unions")
        .select("conjoint_1,conjoint_2,date_union,type")
        .or(`conjoint_1.eq.${id},conjoint_2.eq.${id}`),
      supabase
        .from("temoignages")
        .select("id,titre,audio_url,duree,cree_le")
        .eq("personne_id", id)
        .order("cree_le", { ascending: false }),
    ]);

  const parentsIds = [...new Set((parentsRes.data ?? []).map((r) => r.parent_id))];
  const enfantsIds = (enfantsRes.data ?? []).map((r) => r.enfant_id);
  const temoignages = (temoignagesRes.data ?? []) as {
    id: string;
    titre: string | null;
    audio_url: string;
    duree: number | null;
    cree_le: string | null;
  }[];
  const conjointsIds = (unionsRes.data ?? []).map((u) =>
    u.conjoint_1 === id ? u.conjoint_2 : u.conjoint_1
  );
  const unions = (unionsRes.data ?? []).map((u) => ({
    conjointId: u.conjoint_1 === id ? u.conjoint_2 : u.conjoint_1,
    date: u.date_union,
    type: u.type,
  }));

  const listeIds = [...new Set([...parentsIds, ...enfantsIds, ...conjointsIds])];
  const { data: lies } = listeIds.length
    ? await supabase
        .from("personnes")
        .select("id,nom,prenom,sexe,date_naissance,date_deces,vivant")
        .in("id", listeIds)
    : { data: null as null };

  // Frères et sœurs : ceux qui partagent au moins un parent avec la personne.
  const freresIds: string[] = [];
  if (parentsIds.length > 0) {
    const { data: freresRes } = await supabase
      .from("enfants")
      .select("enfant_id")
      .in("parent_id", parentsIds);
    for (const f of freresRes ?? []) {
      if (f.enfant_id !== id && !freresIds.includes(f.enfant_id)) {
        freresIds.push(f.enfant_id);
      }
    }
  }

  const { data: liesFreres } = freresIds.length
    ? await supabase
        .from("personnes")
        .select("id,nom,prenom,sexe,date_naissance,date_deces,vivant")
        .in("id", freresIds)
    : { data: null as null };

  const parId = new Map<string, Personne>();
  for (const l of lies ?? []) parId.set(l.id, l as Personne);

  const lignes = [
    { label: "Sexe", valeur: p.sexe === "M" ? "♂ Homme" : p.sexe === "F" ? "♀ Femme" : "—" },
    {
      label: "Naissance",
      valeur: [p.date_naissance, p.lieu_naissance].filter(Boolean).join(" · ") || "—",
    },
    {
      label: "Décès",
      valeur:
        p.vivant === false
          ? [p.date_deces, p.lieu_deces].filter(Boolean).join(" · ") || "—"
          : "vivant(e)",
    },
    { label: "Quartier", valeur: quartierRes.data?.nom ?? "—" },
    {
      label: "Famille",
      valeur: familleRes.data?.nom ? libelleFamille(familleRes.data.nom) : "—",
    },
    { label: "Profession", valeur: p.profession ?? "—" },
    { label: "Religion", valeur: p.religion ?? "—" },
    { label: "Résidence", valeur: p.residence ?? "—" },
    {
      label: "Situation",
      valeur: p.retraite
        ? "retraité(e)"
        : p.crise_2010_2011
          ? "victime de la crise de 2010-2011"
          : "—",
    },
    { label: "Source", valeur: p.source ?? "—" },
  ];

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 sm:p-6 md:pb-6">
      <div className="flex items-center gap-3">
        <Logo />
        <Link
          href="/tableau"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/85 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Retour au tableau
        </Link>
      </div>

      <section className="mt-4 rounded-2xl border border-current/10 bg-white p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div
            className={cn(
              "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl font-bold",
              p.vivant === false
                ? "bg-neutral-300 text-neutral-600"
                : "bg-emerald-800 text-white"
            )}
            aria-hidden
          >
            {p.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  p.photo_url.startsWith("http")
                    ? p.photo_url
                    : `/photo?p=${encodeURIComponent(p.photo_url)}`
                }
                alt={nomComplet(p)}
                className={cn(
                  "h-full w-full object-cover",
                  p.vivant === false && "grayscale"
                )}
              />
            ) : (
              initiales(p)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight">{nomComplet(p)}</h1>
            {p.surnom && <p className="italic opacity-70">« {p.surnom} »</p>}
            <p className="mt-1 text-sm opacity-80">
              {p.sexe && <span>{p.sexe === "M" ? "♂" : "♀"}</span>} {periode(p)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {estAncetre(p) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1.5 text-sm font-semibold text-amber-800">
                  <Star className="h-4 w-4" aria-hidden /> Ancêtre
                </span>
              )}
              {p.est_fondateur === true && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-3 py-1.5 text-sm font-semibold text-purple-800">
                  <Crown className="h-4 w-4" aria-hidden /> Fondateur
                </span>
              )}
              {conjointsIds.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-3 py-1.5 text-sm font-semibold text-violet-800">
                  <Heart className="h-4 w-4" aria-hidden /> uni(e)
                </span>
              )}
              <span
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold",
                  p.fiabilite === "confirmé"
                    ? "bg-emerald-500/20 text-emerald-800"
                    : p.fiabilite === "probable"
                      ? "bg-yellow-500/20 text-yellow-800"
                      : "bg-neutral-500/20 text-neutral-700"
                )}
              >
                {p.fiabilite ?? "en cours"}
              </span>
            </div>
          </div>
        </div>

        <dl className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {lignes.map((l) => (
            <div
              key={l.label}
              className="flex justify-between gap-4 border-b border-current/10 py-1.5"
            >
              <dt className="opacity-70">{l.label}</dt>
              <dd className="text-right font-medium">{l.valeur}</dd>
            </div>
          ))}
        </dl>
      </section>

      {p.biographie && (
        <section className="mt-4 rounded-2xl border border-current/10 bg-white p-6">
          <h2 className="mb-2 font-semibold">Biographie</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed opacity-80">
            {p.biographie}
          </p>
        </section>
      )}

      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        <Bloc titre="Parents" vide="Parents inconnus" nombre={parentsIds.length}>
          {parentsIds.map((pid) => (
            <LienPersonne key={pid} id={pid} personne={parId.get(pid)} />
          ))}
        </Bloc>
        <Bloc titre="Unions" vide="Aucune union déclarée" nombre={unions.length}>
          {unions.map((u) => (
            <LienPersonne
              key={u.conjointId}
              id={u.conjointId}
              personne={parId.get(u.conjointId)}
            />
          ))}
        </Bloc>
        <Bloc titre="Enfants" vide="Aucun enfant déclaré" nombre={enfantsIds.length}>
          {enfantsIds.map((eid) => (
            <LienPersonne key={eid} id={eid} personne={parId.get(eid)} />
          ))}
        </Bloc>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        <Bloc
          titre="Frères & sœurs"
          vide="Aucun frère ni sœur déclaré"
          nombre={freresIds.length}
        >
          {freresIds.map((fid) => (
            <LienPersonne
              key={fid}
              id={fid}
              personne={(liesFreres ?? []).find((f) => f.id === fid) as Personne | undefined}
            />
          ))}
        </Bloc>
        <section className="rounded-xl border border-current/10 bg-white p-4 sm:col-span-2">
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <Play className="h-4 w-4 text-emerald-700" aria-hidden />
            Témoignages audio
          </h2>
          {temoignages.length === 0 ? (
            <p className="text-sm opacity-60">
              Aucun témoignage enregistré. Enregistrez le premier avec l&apos;onglet
              « Activités » → « Témoignage audio ».
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {temoignages.map((t) => (
                <li key={t.id} className="rounded-xl border border-neutral-200 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {t.titre ?? "Témoignage"}
                    </span>
                    {t.duree ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs opacity-60">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {`${Math.floor(t.duree / 60)}:${String(Math.round(t.duree % 60)).padStart(2, "0")}`}
                      </span>
                    ) : null}
                  </div>
                  <audio
                    controls
                    preload="none"
                    src={`/audio?t=${encodeURIComponent(t.audio_url)}`}
                    className="w-full"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      {estEditeur && <ActionsFiche id={id} />}

      <ActionsFlottantes id={id} />
      <NavigationBas />
    </main>
  );
}