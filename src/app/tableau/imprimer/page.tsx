import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { nomComplet, periode } from "@/lib/arbre";
import BoutonImprimer from "./bouton-imprimer";
import Logo from "@/components/branding/logo";

export const metadata: Metadata = { title: "Version papier de la généalogie" };
export const dynamic = "force-dynamic";

type Ligne = {
  id: string;
  nom: string;
  prenom: string | null;
  sexe: string | null;
  date_naissance: string | null;
  date_deces: string | null;
  vivant: boolean | null;
  source: string | null;
  fiabilite: string | null;
  quartier_id: string | null;
  famille_id: string | null;
};

export default async function ImprimerPage() {
  const supabase = await createClient();

  const [personnesRes, liensRes, unionsRes, quartiersRes, famillesRes] =
    await Promise.all([
      supabase
        .from("personnes")
        .select(
          "id,nom,prenom,sexe,date_naissance,date_deces,vivant,source,fiabilite,quartier_id,famille_id"
        )
        .order("nom"),
      supabase.from("enfants").select("parent_id,enfant_id"),
      supabase.from("unions").select("conjoint_1,conjoint_2,date_union,type"),
      supabase.from("quartiers").select("id,nom").order("ordre"),
      supabase.from("familles").select("id,nom,quartier_id").order("nom"),
    ]);

  const personnes = (personnesRes.data ?? []) as Ligne[];
  const liens = (liensRes.data ?? []) as {
    parent_id: string;
    enfant_id: string;
  }[];
  const unions = (unionsRes.data ?? []) as {
    conjoint_1: string;
    conjoint_2: string;
    date_union: string | null;
    type: string | null;
  }[];
  const quartiers = (quartiersRes.data ?? []) as { id: string; nom: string }[];
  const familles = (famillesRes.data ?? []) as {
    id: string;
    nom: string;
    quartier_id: string | null;
  }[];

  const quartierNom = new Map(quartiers.map((q) => [q.id, q.nom]));
  const familleNom = new Map(familles.map((f) => [f.id, f.nom]));
  const parId = new Map(personnes.map((p) => [p.id, p]));

  const parentsDe = new Map<string, string[]>();
  const enfantsDe = new Map<string, string[]>();
  for (const l of liens) {
    const p = parentsDe.get(l.enfant_id) ?? [];
    p.push(l.parent_id);
    parentsDe.set(l.enfant_id, p);
    const e = enfantsDe.get(l.parent_id) ?? [];
    e.push(l.enfant_id);
    enfantsDe.set(l.parent_id, e);
  }

  const conjointDe = new Map<string, string | null>();
  for (const u of unions) {
    conjointDe.set(u.conjoint_1, u.conjoint_2);
    conjointDe.set(u.conjoint_2, u.conjoint_1);
  }

  const groupes = quartiers.map((q) => ({
    quartier: q,
    familles: familles
      .filter((f) => f.quartier_id === q.id)
      .map((f) => ({
        ...f,
        membres: personnes.filter((p) => p.famille_id === f.id),
      })),
    sansFamille: personnes.filter(
      (p) => p.quartier_id === q.id && !p.famille_id
    ),
  }));

  const sansQuartier = personnes.filter((p) => !p.quartier_id);

  const CelluleNom = ({ id }: { id: string }) => {
    const p = parId.get(id);
    return p ? <>{nomComplet(p)}</> : <span className="opacity-50">—</span>;
  };

  return (
    <main className="mx-auto max-w-4xl rounded-3xl bg-white p-4 sm:p-6 print:max-w-none print:rounded-none print:bg-white print:p-0">
      <style>{`
        @media print {
          body { font-size: 9pt; }
          main { padding: 0 !important; }
          table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <a
          href="/tableau"
          className="inline-flex items-center gap-1.5 text-sm font-medium opacity-80 transition hover:opacity-100"
        >
          ← Retour
        </a>
        <BoutonImprimer />
      </div>

      <header className="mb-6 flex items-center gap-3 border-b-2 border-amber-700 pb-3">
        <div className="hidden print:block">
          <Logo />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            Généalogie Toa-Zéo — le Grand Tableau
          </h1>
          <p className="text-sm opacity-70">
            Document édité le {new Date().toLocaleDateString("fr-FR")} ·{" "}
            {personnes.length} personnes · {unions.length} unions ·{" "}
            {quartiers.length} quartiers
          </p>
        </div>
      </header>

      {groupes.map(({ quartier, familles: famillesGroupe, sansFamille }) => (
        <section key={quartier.id} className="mb-6 print:mb-4">
          <h2 className="mb-2 text-lg font-bold text-amber-900">
            {quartier.nom}
          </h2>
          {famillesGroupe.map((f) => (
            <div key={f.id} className="mb-4 print:mb-3">
              <h3 className="mb-1 text-sm font-semibold text-amber-800">
                Famille {f.nom}
              </h3>
              <TablePersonnes
                membres={f.membres}
                parentsDe={parentsDe}
                enfantsDe={enfantsDe}
                conjointDe={conjointDe}
                CelluleNom={CelluleNom}
              />
            </div>
          ))}
          {sansFamille.length > 0 && (
            <div className="mb-4 print:mb-3">
              <h3 className="mb-1 text-sm font-semibold text-amber-800">
                Sans famille déclarée
              </h3>
              <TablePersonnes
                membres={sansFamille}
                parentsDe={parentsDe}
                enfantsDe={enfantsDe}
                conjointDe={conjointDe}
                CelluleNom={CelluleNom}
              />
            </div>
          )}
        </section>
      ))}

      {sansQuartier.length > 0 && (
        <section className="mb-6 print:mb-4">
          <h2 className="mb-2 text-lg font-bold text-amber-900">
            Sans quartier
          </h2>
          <TablePersonnes
            membres={sansQuartier}
            parentsDe={parentsDe}
            enfantsDe={enfantsDe}
            conjointDe={conjointDe}
            CelluleNom={CelluleNom}
          />
        </section>
      )}

      <footer className="mt-8 border-t border-current/20 pt-3 text-xs opacity-60">
        Généalogie Toa-Zéo — document établi par le CHO à partir de la base du
        village.
      </footer>
    </main>
  );
}

function TablePersonnes({
  membres,
  parentsDe,
  enfantsDe,
  conjointDe,
  CelluleNom,
}: {
  membres: Ligne[];
  parentsDe: Map<string, string[]>;
  enfantsDe: Map<string, string[]>;
  conjointDe: Map<string, string | null>;
  CelluleNom: (props: { id: string }) => React.ReactNode;
}) {
  return (
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="border-b border-current/20">
          <th className="py-1 pr-2 font-semibold">Personne</th>
          <th className="py-1 pr-2 font-semibold">Naissance</th>
          <th className="py-1 pr-2 font-semibold">Décès</th>
          <th className="py-1 pr-2 font-semibold">Parents</th>
          <th className="py-1 pr-2 font-semibold">Union</th>
          <th className="py-1 pr-2 font-semibold">Enfants</th>
          <th className="py-1 font-semibold">Source</th>
        </tr>
      </thead>
      <tbody>
        {membres.map((p) => (
          <tr key={p.id} className="border-b border-current/10 align-top">
            <td className="py-1 pr-2 font-medium">
              {nomComplet(p)}
              <span className="block text-[9px] opacity-60">
                {p.sexe === "M" ? "♂" : p.sexe === "F" ? "♀" : ""}{" "}
                {p.fiabilite}
              </span>
            </td>
            <td className="py-1 pr-2">{p.date_naissance ?? "—"}</td>
            <td className="py-1 pr-2">
              {p.vivant === false ? (p.date_deces ?? "—") : "vivant(e)"}
            </td>
            <td className="py-1 pr-2">
              {(parentsDe.get(p.id) ?? []).map((pid) => (
                <span key={pid} className="block">
                  <CelluleNom id={pid} />
                </span>
              ))}
              {(parentsDe.get(p.id) ?? []).length === 0 && (
                <span className="opacity-50">—</span>
              )}
            </td>
            <td className="py-1 pr-2">
              {conjointDe.get(p.id) && <CelluleNom id={conjointDe.get(p.id)!} />}
              {!conjointDe.get(p.id) && <span className="opacity-50">—</span>}
            </td>
            <td className="py-1 pr-2">
              {(enfantsDe.get(p.id) ?? []).slice(0, 6).map((eid) => (
                <span key={eid} className="block">
                  <CelluleNom id={eid} />
                </span>
              ))}
              {(enfantsDe.get(p.id) ?? []).length > 6 && (
                <span className="opacity-50">
                  + {(enfantsDe.get(p.id) ?? []).length - 6} autres
                </span>
              )}
              {(enfantsDe.get(p.id) ?? []).length === 0 && (
                <span className="opacity-50">—</span>
              )}
            </td>
            <td className="py-1">{p.source ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
