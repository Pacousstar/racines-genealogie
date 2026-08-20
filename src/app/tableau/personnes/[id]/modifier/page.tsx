import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import FormulaireDeclaration, {
  type PersonneEdition,
} from "@/components/saisie/formulaire-declaration";
import NavigationBas from "@/components/mobile/navigation-bas";
import Logo from "@/components/branding/logo";
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

  const CHAMPS_BASE =
    "id,nom,prenom,surnom,sexe,vivant,date_naissance,date_deces,quartier_id,famille_id,photo_url,source,fiabilite";

  const { data: personne } = (await (async () => {
    const essai = await supabase
      .from("personnes")
      .select(`${CHAMPS_BASE},retraite,residence,crise_2010_2011,profession,religion,est_ancetre`)
      .eq("id", id)
      .single();
    if (!essai.error) return essai;
    if (/column .* does not exist|could not find/i.test(essai.error.message)) {
      return supabase
        .from("personnes")
        .select(CHAMPS_BASE)
        .eq("id", id)
        .single();
    }
    return essai;
  })()) as {
    data:
      | ({
          id: string;
          nom: string;
          prenom: string | null;
          surnom: string | null;
          sexe: string | null;
          vivant: boolean;
          date_naissance: string | null;
          date_deces: string | null;
          quartier_id: string | null;
          famille_id: string | null;
          photo_url: string | null;
          source: string | null;
          fiabilite: string | null;
        } & {
          retraite?: boolean | null;
          residence?: string | null;
          crise_2010_2011?: boolean | null;
          profession?: string | null;
          religion?: string | null;
          est_ancetre?: boolean | null;
        })
      | null;
    error: { message: string } | null;
  };

  if (!personne) notFound();

  const [parentsRes, enfantsRes, quartiersRes, famillesRes] = await Promise.all([
    supabase.from("enfants").select("parent_id").eq("enfant_id", id),
    supabase.from("enfants").select("enfant_id").eq("parent_id", id),
    supabase.from("quartiers").select("id,nom").order("ordre"),
    supabase.from("familles").select("id,nom,quartier_id").order("nom"),
  ]);

  // Toutes les unions de cette personne, triées par rang : le premier
  // conjoint (rang le plus petit) est le « conjoint principal ».
  const unionsRes = await (async () => {
    const essai = await supabase
      .from("unions")
      .select("conjoint_1,conjoint_2,rang")
      .order("rang", { ascending: true, nullsFirst: false })
      .or(`conjoint_1.eq.${id},conjoint_2.eq.${id}`);
    if (!essai.error) return essai;
    if (/column .* does not exist|could not find/i.test(essai.error.message)) {
      return supabase
        .from("unions")
        .select("conjoint_1,conjoint_2")
        .or(`conjoint_1.eq.${id},conjoint_2.eq.${id}`);
    }
    return essai;
  })();

  const parentsIds = (parentsRes.data ?? []).map((r) => r.parent_id);
  const enfantsIds = (enfantsRes.data ?? []).map((r) => r.enfant_id);

  // L'« autre parent » de chaque enfant (la mère en général) : il doit être
  // réaffiché dans le formulaire, sinon la modification de cette personne le
  // supprimerait silencieusement.
  const { data: autresParents } = enfantsIds.length
    ? await supabase
        .from("enfants")
        .select("parent_id,enfant_id")
        .in("enfant_id", enfantsIds)
    : { data: null as null };
  const conjointsIds = [
    ...new Set(
      (unionsRes.data ?? []).map((u) =>
        u.conjoint_1 === id ? u.conjoint_2 : u.conjoint_1
      )
    ),
  ];

  const lieIds = [
    ...new Set([
      ...parentsIds,
      ...enfantsIds,
      ...conjointsIds,
      ...(autresParents ?? []).map((l) => l.parent_id),
    ]),
  ];

  const { data: lies } = lieIds.length
    ? await supabase
        .from("personnes")
        .select("id,nom,prenom,sexe,date_naissance,date_deces,vivant")
        .in("id", lieIds)
    : { data: null as null };

  const parId = new Map<string, ResultatPersonne>();
  for (const l of lies ?? []) parId.set(l.id, l as ResultatPersonne);

  const autreParentDe = new Map<string, ResultatPersonne | null>();
  for (const l of autresParents ?? []) {
    if (l.parent_id === id) continue;
    const autre = parId.get(l.parent_id);
    if (autre && !autreParentDe.has(l.enfant_id)) {
      autreParentDe.set(l.enfant_id, autre);
    }
  }

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
    retraite: personne.retraite ?? false,
    residence: personne.residence ?? null,
    crise_2010_2011: personne.crise_2010_2011 ?? false,
    profession: personne.profession ?? null,
    religion: personne.religion ?? null,
    est_ancetre: personne.est_ancetre ?? false,
    pere: pere ? parId.get(pere) ?? null : null,
    mere: mere ? parId.get(mere) ?? null : null,
    conjoints: conjointsIds
      .map((cid) => parId.get(cid))
      .filter((p): p is ResultatPersonne => Boolean(p)),
    enfants: (enfantsIds
      .map((eid) => {
        const p = parId.get(eid);
        if (!p) return null;
        return { ...p, autre_parent: autreParentDe.get(eid) ?? null };
      })
      .filter((p): p is ResultatPersonne & { autre_parent: ResultatPersonne | null } => Boolean(p))),
  };

  return (
    <main className="min-h-dvh p-4 pb-24 sm:p-6 md:pb-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <Logo />
          <Link
            href={`/tableau/personnes/${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Retour à la fiche
          </Link>
        </div>

        <h1 className="mt-3 mb-1 text-2xl font-bold text-white">
          ✏ Modifier la personne
        </h1>
        <p className="mb-6 text-sm text-white/85">
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
      </div>
      <NavigationBas />
    </main>
  );
}
