import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, Heart, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ActionsFiche from "@/components/saisie/actions-fiche";
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
] as const;

type PersonneFiche = Personne & {
  lieu_naissance: string | null;
  lieu_deces: string | null;
  biographie: string | null;
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

  const { data: personne } = await supabase
    .from("personnes")
    .select(CHAMPS.join(","))
    .eq("id", id)
    .single();

  if (!personne) notFound();

  const p = personne as unknown as PersonneFiche;

  const [quartierRes, familleRes, parentsRes, enfantsRes, unionsRes] =
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
    ]);

  const parentsIds = [...new Set((parentsRes.data ?? []).map((r) => r.parent_id))];
  const enfantsIds = (enfantsRes.data ?? []).map((r) => r.enfant_id);
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
    { label: "Source", valeur: p.source ?? "—" },
  ];

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
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

      {estEditeur && <ActionsFiche id={id} />}
    </main>
  );
}