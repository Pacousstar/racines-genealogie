import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import FormulaireDeclaration, {
  type PersonneEdition,
} from "@/components/saisie/formulaire-declaration";
import type { ResultatPersonne } from "@/components/saisie/recherche-personne";

export const metadata: Metadata = { title: "Modifier la personne" };
export const dynamic = "force-dynamic";

export default async function ModifierPersonnePage({
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

  if (!estEditeur) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          La modification est réservée à l&apos;éditeur (le CHO) et à
          l&apos;admin. Votre compte est en lecture seule.
        </p>
      </main>
    );
  }

  const { data: personne } = await supabase
    .from("personnes")
    .select(
      "id,nom,prenom,surnom,sexe,vivant,date_naissance,date_deces,quartier_id,famille_id,photo_url,source,fiabilite"
    )
    .eq("id", id)
    .single();

  if (!personne) notFound();

  const [parentsRes, enfantsRes, unionsRes, quartiersRes, famillesRes] = await Promise.all([
    supabase.from("enfants").select("parent_id").eq("enfant_id", id),
    supabase.from("enfants").select("enfant_id").eq("parent_id", id),
    supabase
      .from("unions")
      .select("conjoint_1,conjoint_2")
      .or(`conjoint_1.eq.${id},conjoint_2.eq.${id}`),
    supabase.from("quartiers").select("id,nom").order("ordre"),
    supabase.from("familles").select("id,nom,quartier_id").order("nom"),
  ]);

  const parentsIds = (parentsRes.data ?? []).map((r) => r.parent_id);
  const enfantsIds = (enfantsRes.data ?? []).map((r) => r.enfant_id);
  const union = (unionsRes.data ?? [])[0];
  const conjointId = union
    ? union.conjoint_1 === id
      ? union.conjoint_2
      : union.conjoint_1
    : null;

  const lieIds = [
    ...new Set([...parentsIds, ...enfantsIds, ...(conjointId ? [conjointId] : [])]),
  ];

  const { data: lies } = lieIds.length
    ? await supabase
        .from("personnes")
        .select("id,nom,prenom,sexe,date_naissance,date_deces,vivant")
        .in("id", lieIds)
    : { data: null as null };

  const parId = new Map<string, ResultatPersonne>();
  for (const l of lies ?? []) parId.set(l.id, l as ResultatPersonne);

  const pere =
    parentsIds.find((pid) => parId.get(pid)?.sexe === "M") ??
    parentsIds.find((pid) => parId.get(pid)) ??
    null;
  const mere =
    parentsIds.find((pid) => parId.get(pid)?.sexe === "F") ??
    parentsIds.find((pid) => pid !== pere && parId.get(pid)) ??
    null;

  const edition: PersonneEdition = {
    id,
    nom: personne.nom,
    prenom: personne.prenom,
    surnom: personne.surnom,
    sexe: (personne.sexe as "M" | "F" | null) ?? null,
    vivant: personne.vivant,
    date_naissance: personne.date_naissance,
    date_deces: personne.date_deces,
    quartier_id: personne.quartier_id,
    famille_id: personne.famille_id,
    photo_url: personne.photo_url,
    source: personne.source,
    fiabilite: personne.fiabilite,
    pere: pere ? parId.get(pere) ?? null : null,
    mere: mere ? parId.get(mere) ?? null : null,
    conjoint: conjointId ? parId.get(conjointId) ?? null : null,
    enfants: enfantsIds
      .map((eid) => parId.get(eid))
      .filter((p): p is ResultatPersonne => Boolean(p)),
  };

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <Link
        href={`/tableau/personnes/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium opacity-80 transition hover:opacity-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Retour à la fiche
      </Link>

      <h1 className="mt-3 mb-1 text-2xl font-bold">✏ Modifier la personne</h1>
      <p className="mb-6 text-sm opacity-70">
        Corrigez les informations — les liens (parents, conjoint) seront
        remplacés par ce que vous choisissez ici.
      </p>

      <FormulaireDeclaration
        personne={edition}
        options={{
          quartiers: quartiersRes.data ?? [],
          familles: (famillesRes.data ?? []) as {
            id: string;
            nom: string;
            quartier_id: string | null;
          }[],
        }}
      />
    </main>
  );
}
