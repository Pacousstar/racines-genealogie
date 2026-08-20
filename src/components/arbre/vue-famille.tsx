"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Star, Trees } from "lucide-react";
import {
  type Personne,
  type LienEnfant,
  type Union,
  estAncetre,
  initiales,
  nomComplet,
  periode,
} from "@/lib/arbre";
import {
  COULEURS_QUARTIERS,
  type CouleurQuartier,
  TINTE,
  BORDES,
} from "@/lib/couleurs-quartiers";
import RecherchePersonne from "@/components/saisie/recherche-personne";
import styles from "./arbre.module.css";
import { cn } from "@/lib/utils";

type Props = {
  personnes: Personne[];
  liens: LienEnfant[];
  unions: Union[];
  quartiers: { id: string; nom: string }[];
  familles: { id: string; nom: string; quartier_id: string | null }[];
  onBasculerArbre: () => void;
  focusInitial?: string | null;
};

function CarteFamille({
  personne: p,
  couleur,
  quartier,
  onChoisir,
  centrale = false,
}: {
  personne: Personne;
  couleur: CouleurQuartier | null;
  quartier?: string | null;
  onChoisir: (id: string) => void;
  centrale?: boolean;
}) {
  const mort = p.vivant === false;
  const ancetre = estAncetre(p);
  const photoSrc = p.photo_url
    ? p.photo_url.startsWith("http")
      ? p.photo_url
      : `/photo?p=${encodeURIComponent(p.photo_url)}`
    : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onChoisir(p.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChoisir(p.id);
        }
      }}
      className={cn(
        "group relative flex w-44 cursor-pointer flex-col gap-1.5 rounded-xl border-2 bg-white p-3 text-center text-blue-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        mort
          ? "border-neutral-300 opacity-80 grayscale"
          : couleur
            ? BORDES[couleur]
            : "border-emerald-700/60 hover:border-emerald-700",
        ancetre && !mort && "border-amber-500 bg-amber-100 shadow-md",
        centrale && "ring-4 ring-emerald-700/25"
      )}
      style={
        !ancetre && couleur && !mort
          ? { backgroundColor: TINTE[couleur] }
          : undefined
      }
    >
      <Link
        href={`/tableau/personnes/${p.id}`}
        className="absolute right-1.5 top-1.5 rounded p-0.5 opacity-0 transition hover:bg-current/10 group-hover:opacity-100"
        title="Ouvrir la fiche détaillée"
        aria-label="Ouvrir la fiche détaillée"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </Link>

      {ancetre && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-amber-500 px-2.5 py-1 text-sm font-bold text-white shadow">
          <Star className="h-3.5 w-3.5" aria-hidden /> Ancêtre
        </span>
      )}

      <div
        className={cn(
          "mx-auto flex h-16 w-16 items-center justify-center rounded-lg text-xl font-bold",
          mort
            ? "bg-neutral-300 text-neutral-600"
            : ancetre
              ? "bg-amber-500 text-white"
              : "bg-emerald-800 text-white"
        )}
        aria-hidden
      >
        {photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoSrc}
            alt={nomComplet(p)}
            className={cn(
              "h-full w-full rounded-lg object-cover",
              mort && "grayscale"
            )}
          />
        ) : (
          initiales(p)
        )}
      </div>

      <div>
        <div className="text-lg font-bold leading-tight">{nomComplet(p)}</div>
        {p.surnom && (
          <div className="text-sm italic opacity-80">« {p.surnom} »</div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1 text-base opacity-90">
        {p.sexe && <span>{p.sexe === "M" ? "♂" : "♀"}</span>}
        <span>{periode(p)}</span>
      </div>

      {quartier && (
        <span className="mx-auto inline-flex max-w-full items-center gap-0.5 truncate rounded-full bg-current/10 px-2 py-0.5 text-sm font-medium opacity-95">
          {quartier}
        </span>
      )}

      {p.fiabilite === "confirmé" && (
        <span className="mx-auto rounded-full bg-emerald-500/15 px-2.5 py-1 text-sm font-semibold text-emerald-800">
          ✓ confirmé
        </span>
      )}
    </div>
  );
}

function UnionSep() {
  return (
    <div className={styles.union} aria-hidden>
      <span className={styles.trait} />
      <span className={styles.symbole}>⚭</span>
      <span className={styles.trait} />
    </div>
  );
}

export default function VueFamille({
  personnes,
  liens,
  unions,
  quartiers,
  familles,
  onBasculerArbre,
  focusInitial = null,
}: Props) {
  const parId = useMemo(
    () => new Map(personnes.map((p) => [p.id, p])),
    [personnes]
  );

  const ancetreId = useMemo(
    () =>
      personnes.find((p) => estAncetre(p))?.id ??
      personnes.find((p) => p.est_fondateur)?.id ??
      personnes[0]?.id ??
      null,
    [personnes]
  );

  const [focusId, setFocusId] = useState<string | null>(focusInitial ?? ancetreId);

  const labels = useMemo(() => {
    const quartiersParId = new Map(quartiers.map((q) => [q.id, q.nom]));
    const famillesParId = new Map(familles.map((f) => [f.id, f.nom]));
    const couleurById = (id: string | null): CouleurQuartier | null => {
      if (!id) return null;
      const index = quartiers.findIndex((q) => q.id === id);
      return index >= 0
        ? COULEURS_QUARTIERS[index % COULEURS_QUARTIERS.length]
        : null;
    };
    return {
      quartierNom: (id: string | null) =>
        id ? quartiersParId.get(id) ?? "" : "",
      familleNom: (id: string | null) => (id ? famillesParId.get(id) ?? "" : ""),
      couleurById,
    };
  }, [quartiers, familles]);

  const parentsDe = useCallback(
    (id: string): Personne[] => {
      const sortis: Personne[] = [];
      for (const l of liens) {
        if (l.enfant_id !== id) continue;
        const p = parId.get(l.parent_id);
        if (p) sortis.push(p);
      }
      return sortis;
    },
    [liens, parId]
  );

  const conjointsDe = useCallback(
    (id: string): Personne[] => {
      const sortis: { personne: Personne; rang: number }[] = [];
      for (const u of unions) {
        let autreId: string | null = null;
        if (u.conjoint_1 === id) autreId = u.conjoint_2;
        else if (u.conjoint_2 === id) autreId = u.conjoint_1;
        if (!autreId) continue;
        const p = parId.get(autreId);
        if (p) sortis.push({ personne: p, rang: u.rang ?? sortis.length });
      }
      sortis.sort((a, b) => a.rang - b.rang);
      return sortis.map((o) => o.personne);
    },
    [unions, parId]
  );

  const enfantsDe = useCallback(
    (id: string): Personne[] => {
      const sortis: { personne: Personne; rang: number }[] = [];
      for (const l of liens) {
        if (l.parent_id !== id) continue;
        const p = parId.get(l.enfant_id);
        if (p) sortis.push({ personne: p, rang: l.rang ?? sortis.length });
      }
      sortis.sort((a, b) => a.rang - b.rang);
      return sortis.map((o) => o.personne);
    },
    [liens, parId]
  );

  const focus = focusId ? parId.get(focusId) : null;

  const parents = useMemo(
    () =>
      focus
        ? parentsDe(focus.id).sort((a, b) =>
            a.sexe === "M" && b.sexe !== "M" ? -1 : b.sexe === "M" ? 1 : 0
          )
        : [],
    [focus, parentsDe]
  );

  const conjoints = useMemo(
    () => (focus ? conjointsDe(focus.id) : []),
    [focus, conjointsDe]
  );

  const conjointIds = useMemo(() => new Set(conjoints.map((c) => c.id)), [conjoints]);

  const enfants = useMemo(
    () =>
      focus
        ? enfantsDe(focus.id).map((e) => ({
            personne: e,
            autreParent:
              parentsDe(e.id).find(
                (p) => p.id !== focus.id && !conjointIds.has(p.id)
              ) ?? null,
          }))
        : [],
    [focus, enfantsDe, parentsDe, conjointIds]
  );

  const carte = (
    p: Personne,
    onChoisir: (id: string) => void,
    centrale = false
  ) => (
    <CarteFamille
      personne={p}
      couleur={labels.couleurById(p.quartier_id)}
      quartier={labels.quartierNom(p.quartier_id)}
      onChoisir={onChoisir}
      centrale={centrale}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border-2 border-emerald-600 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56">
          <RecherchePersonne
            key={focusId ?? "vide"}
            label="Personne centrale"
            placeholder="Choisir une personne…"
            valeurInitiale={focus ?? null}
            onChange={(p) => p && setFocusId(p.id)}
          />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wide opacity-60">
            Famille de
          </span>
          <div className="truncate text-lg font-bold leading-tight text-emerald-900">
            {focus ? nomComplet(focus) : "—"}
          </div>
        </div>
        {focusId && ancetreId && focusId !== ancetreId && (
          <button
            type="button"
            onClick={() => setFocusId(ancetreId)}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/50 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            <Star className="h-3.5 w-3.5" aria-hidden /> Revenir à l&apos;ancêtre
          </button>
        )}
        <button
          type="button"
          onClick={onBasculerArbre}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          <Trees className="h-4 w-4" aria-hidden /> Arbre complet
        </button>
      </div>

      {!focus ? (
        <p className="px-6 py-10 text-center text-sm opacity-70">
          Aucune personne pour l&apos;instant. Déclarez la première famille.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 items-start overflow-auto">
          <div className="my-auto flex w-max min-w-full flex-col items-start py-6">
            {parents.length > 0 && (
              <>
                <div className={cn(styles.couple, "mx-auto")}>
                  {parents.map((parent, i) => (
                    <Fragment key={parent.id}>
                      {i > 0 && <UnionSep />}
                      {carte(parent, setFocusId)}
                    </Fragment>
                  ))}
                </div>
                <div
                  className="mx-auto h-6 w-0.5"
                  style={{ background: "var(--arbre-ligne)" }}
                />
              </>
            )}

            <div className={cn(styles.couple, "mx-auto")}>
              {carte(focus, setFocusId, true)}
              {conjoints.map((c) => (
                <Fragment key={c.id}>
                  <UnionSep />
                  {carte(c, setFocusId)}
                </Fragment>
              ))}
            </div>

            {enfants.length > 0 && (
              <>
                <div
                  className="mx-auto h-16 w-0.5"
                  style={{ background: "var(--arbre-ligne)" }}
                />
                <ul className={cn(styles.fratrie, styles.arbre, "mx-auto")}>
                  {enfants.map(({ personne: enfant, autreParent }) => (
                    <li key={enfant.id}>
                      <div className="flex items-start justify-center">
                        <span className={styles.attache}>
                          {carte(enfant, setFocusId)}
                        </span>
                        {autreParent && (
                          <>
                            <div
                              className="mx-1 h-0.5 w-10"
                              style={{ background: "var(--arbre-ligne)" }}
                              aria-hidden
                            />
                            <span className="relative flex flex-col items-center gap-1">
                              <span className={styles.attache}>
                                {carte(autreParent, setFocusId)}
                              </span>
                              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-bold text-neutral-600">
                                {autreParent.sexe === "M" ? "père de" : "mère de"}
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}