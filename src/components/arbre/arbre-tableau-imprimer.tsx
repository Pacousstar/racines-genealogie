"use client";

import { useMemo } from "react";
import {
  type Personne,
  type LienEnfant,
  type Union,
  type ArbreNoeud,
  construitArbre,
  nomComplet,
  initiales,
  estAncetre,
} from "@/lib/arbre";
import {
  COULEURS_QUARTIERS,
  type CouleurQuartier,
  TINTE,
  BORDES,
} from "@/lib/couleurs-quartiers";
import { cn } from "@/lib/utils";

type Props = {
  personnes: Personne[];
  liens: LienEnfant[];
  unions: Union[];
  quartiers: { id: string; nom: string }[];
  familles: { id: string; nom: string; quartier_id: string | null }[];
};

type LigneArbre = {
  personne: Personne;
  profondeur: number;
  lien: string;
  couleur: CouleurQuartier | null;
};

const LIGNES_PAR_PAGE = 40;

function aplatirArbre(
  noeud: ArbreNoeud,
  profondeur: number,
  lien: string,
  couleurById: (id: string | null) => CouleurQuartier | null,
  resultat: LigneArbre[]
) {
  resultat.push({
    personne: noeud.personne,
    profondeur,
    lien,
    couleur: couleurById(noeud.personne.quartier_id),
  });

  if (noeud.conjoint) {
    resultat.push({
      personne: noeud.conjoint,
      profondeur,
      lien: "conjoint(e)",
      couleur: couleurById(noeud.conjoint.quartier_id),
    });
  }

  for (const ac of noeud.autresConjoints) {
    resultat.push({
      personne: ac.conjoint,
      profondeur,
      lien: "conjoint(e) (2)",
      couleur: couleurById(ac.conjoint.quartier_id),
    });
    for (const enfant of ac.enfants) {
      aplatirArbre(enfant, profondeur + 1, "enfant", couleurById, resultat);
    }
  }

  for (const enfant of noeud.enfants) {
    aplatirArbre(enfant, profondeur + 1, "enfant", couleurById, resultat);
  }
}

function CellulePhoto({ personne: p }: { personne: Personne }) {
  const mort = p.vivant === false;
  const ancetre = estAncetre(p);
  const photoSrc = p.photo_url
    ? p.photo_url.startsWith("http")
      ? p.photo_url
      : `/photo?p=${encodeURIComponent(p.photo_url)}`
    : null;

  return (
    <div
      className={cn(
        "mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold",
        mort && !ancetre
          ? "bg-neutral-300 text-neutral-600"
          : ancetre
            ? "bg-amber-500 text-white"
            : "bg-emerald-800 text-white"
      )}
    >
      {photoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoSrc}
          alt={nomComplet(p)}
          className={cn(
            "h-full w-full rounded-lg object-cover",
            mort && !ancetre && "grayscale"
          )}
        />
      ) : (
        initiales(p)
      )}
    </div>
  );
}

function LignePersonne({
  ligne,
  avecBordure,
}: {
  ligne: LigneArbre;
  avecBordure: boolean;
}) {
  const p = ligne.personne;
  const mort = p.vivant === false;
  const ancetre = estAncetre(p);

  return (
    <tr
      className={cn(
        "align-middle",
        avecBordure && "border-b border-amber-100",
        ancetre && "bg-amber-50",
        mort && !ancetre && "bg-neutral-50"
      )}
    >
      <td className="py-1.5 pr-2 text-center">
        <div style={{ paddingLeft: `${ligne.profondeur * 24}px` }}>
          <CellulePhoto personne={p} />
        </div>
      </td>
      <td
        className={cn(
          "py-1.5 pr-3 font-semibold",
          ancetre && "text-amber-900",
          mort && !ancetre && "text-neutral-500"
        )}
      >
        <div style={{ paddingLeft: `${ligne.profondeur * 24}px` }}>
          {nomComplet(p)}
          {ancetre && (
            <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              ★
            </span>
          )}
          {p.surnom && (
            <span className="ml-1 text-[10px] italic opacity-60">
              « {p.surnom} »
            </span>
          )}
        </div>
      </td>
      <td className="py-1.5 pr-3 text-sm">
        {p.date_naissance ?? "—"}
      </td>
      <td className="py-1.5 pr-3 text-sm">
        {mort ? (p.date_deces ?? "—") : ""}
      </td>
      <td className="py-1.5 text-xs opacity-70">
        {mort ? "✝" : ""}
      </td>
    </tr>
  );
}

export default function ArbreTableau({
  personnes,
  liens,
  unions,
  quartiers,
}: Props) {
  const arbre = useMemo(
    () => construitArbre(personnes, liens, unions),
    [personnes, liens, unions]
  );

  const couleurById = useMemo(() => {
    return (id: string | null): CouleurQuartier | null => {
      if (!id) return null;
      const index = quartiers.findIndex((q) => q.id === id);
      return index >= 0
        ? COULEURS_QUARTIERS[index % COULEURS_QUARTIERS.length]
        : null;
    };
  }, [quartiers]);

  const toutesLignes = useMemo(() => {
    const resultat: LigneArbre[] = [];
    for (const racine of arbre) {
      aplatirArbre(racine, 0, "ancêtre", couleurById, resultat);
    }
    return resultat;
  }, [arbre, couleurById]);

  const pages = useMemo(() => {
    const result: LigneArbre[][] = [];
    for (let i = 0; i < toutesLignes.length; i += LIGNES_PAR_PAGE) {
      result.push(toutesLignes.slice(i, i + LIGNES_PAR_PAGE));
    }
    return result.length > 0 ? result : [[]];
  }, [toutesLignes]);

  return (
    <div className="w-full">
      {pages.map((page, i) => (
        <section
          key={i}
          className={cn("mb-6")}
          style={i > 0 ? { pageBreakBefore: "always" } : undefined}
        >
          {i > 0 && (
            <div className="mb-3 hidden text-center text-[10px] text-neutral-400 print:block">
              Généalogie Toa-Zéo — Arbre complet — Page {i + 1}/{pages.length}
            </div>
          )}
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-amber-300 bg-amber-50">
                <th className="w-14 py-1.5 pr-2 text-center font-bold text-amber-900">
                  Photo
                </th>
                <th className="py-1.5 pr-3 font-bold text-amber-900">
                  Nom complet
                </th>
                <th className="py-1.5 pr-3 font-bold text-amber-900">
                  Naissance
                </th>
                <th className="py-1.5 pr-3 font-bold text-amber-900">
                  Décès
                </th>
                <th className="w-10 py-1.5 font-bold text-amber-900">†</th>
              </tr>
            </thead>
            <tbody>
              {page.map((ligne, j) => (
                <LignePersonne
                  key={ligne.personne.id}
                  ligne={ligne}
                  avecBordure={j < page.length - 1}
                />
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
