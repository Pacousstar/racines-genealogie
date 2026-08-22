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
import styles from "./arbre.module.css";
import { cn } from "@/lib/utils";

type Props = {
  personnes: Personne[];
  liens: LienEnfant[];
  unions: Union[];
  quartiers: { id: string; nom: string }[];
  familles: { id: string; nom: string; quartier_id: string | null }[];
};

const SEUIL_PAGE = 12;

function compterDescendants(noeud: ArbreNoeud): number {
  let total = 1;
  if (noeud.conjoint) total++;
  for (const e of noeud.enfants) total += compterDescendants(e);
  for (const ac of noeud.autresConjoints) {
    total++;
    for (const e of ac.enfants) total += compterDescendants(e);
  }
  return total;
}

function CarteImpression({ personne: p }: { personne: Personne }) {
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
        "flex w-28 flex-col items-center gap-1 rounded-xl border-2 bg-white p-2 text-center text-[10px] leading-tight text-blue-900",
        ancetre
          ? "border-amber-500 bg-amber-50"
          : mort
            ? "border-neutral-300 grayscale opacity-80"
            : "border-emerald-700/60"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg text-sm font-bold",
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
      <div className="font-bold text-blue-900">{nomComplet(p)}</div>
      <div className="text-[9px] opacity-70">
        {p.date_naissance ?? "—"}
      </div>
    </div>
  );
}

function UnionSepPrint() {
  return (
    <div className={styles.union} aria-hidden>
      <span className={styles.trait} />
      <span className={styles.symbole}>⚭</span>
      <span className={styles.trait} />
    </div>
  );
}

function NoeudImprimer({
  noeud,
  couleurById,
  racine = false,
}: {
  noeud: ArbreNoeud;
  couleurById: (id: string | null) => CouleurQuartier | null;
  racine?: boolean;
}) {
  const couleur = couleurById(noeud.personne.quartier_id);
  const aPlusieursUnions = noeud.autresConjoints.length > 0;
  const aDesEnfants =
    noeud.enfants.length > 0 ||
    noeud.autresConjoints.some((ac) => ac.enfants.length > 0);
  const groupes = aPlusieursUnions
    ? [
        { conjoint: noeud.conjoint, enfants: noeud.enfants },
        ...noeud.autresConjoints.map((ac) => ({
          conjoint: ac.conjoint,
          enfants: ac.enfants,
        })),
      ]
    : [];

  return (
    <li>
      <div className="relative flex justify-center">
        <div
          className={cn(
            styles.couple,
            couleur && "rounded-2xl border-2 px-2 pb-2 pt-1",
            couleur && BORDES[couleur]
          )}
          data-boite={couleur ? "1" : undefined}
          style={couleur ? { backgroundColor: TINTE[couleur] } : undefined}
        >
          <span
            className={cn(
              styles.attache,
              aDesEnfants && styles.attacheEnfants
            )}
          >
            <CarteImpression personne={noeud.personne} />
          </span>
          {!aPlusieursUnions && noeud.conjoint && (
            <>
              <UnionSepPrint />
              <CarteImpression personne={noeud.conjoint} />
            </>
          )}
        </div>
      </div>
      {aPlusieursUnions ? (
        <ul className={styles.arbre}>
          {groupes.map((groupe, i) => (
            <li key={groupe.conjoint ? groupe.conjoint.id : `sans-${i}`}>
              <div className="relative flex justify-center">
                {groupe.conjoint && (
                  <span
                    className={cn(
                      styles.attache,
                      groupe.enfants.length > 0 && styles.attacheEnfants
                    )}
                  >
                    <CarteImpression personne={groupe.conjoint} />
                  </span>
                )}
              </div>
              {groupe.enfants.length > 0 && (
                <ul className={styles.arbre}>
                  {groupe.enfants.map((enfant) => (
                    <NoeudImprimer
                      key={enfant.personne.id}
                      noeud={enfant}
                      couleurById={couleurById}
                    />
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <>
          {noeud.enfants.length > 0 && (
            <ul className={styles.arbre}>
              {noeud.enfants.map((enfant) => (
                <NoeudImprimer
                  key={enfant.personne.id}
                  noeud={enfant}
                  couleurById={couleurById}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

function couperEnPages(
  racines: ArbreNoeud[],
  seuil: number
): ArbreNoeud[][] {
  const pages: ArbreNoeud[][] = [];
  let courante: ArbreNoeud[] = [];
  let taille = 0;

  for (const racine of racines) {
    const poids = compterDescendants(racine);
    if (taille > 0 && taille + poids > seuil) {
      pages.push(courante);
      courante = [];
      taille = 0;
    }
    courante.push(racine);
    taille += poids;
  }
  if (courante.length > 0) pages.push(courante);
  return pages.length > 0 ? pages : [[]];
}

export default function ArbreImprimer({
  personnes,
  liens,
  unions,
  quartiers,
  familles,
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

  const pages = useMemo(() => couperEnPages(arbre, SEUIL_PAGE), [arbre]);

  return (
    <div className={styles.arbrePrint}>
      {pages.map((page, i) => (
        <section
          key={i}
          className={cn(i > 0 && "print:pageBreak", "mb-8")}
        >
          <div className="pageHeader print:block hidden">
            Généalogie Toa-Zéo — Arbre complet — Page {i + 1}/{pages.length}
          </div>
          <div className="flex justify-center">
            <ul className={cn(styles.arbrePrint, "data-racines")} data-racines="">
              {page.map((racine) => (
                <NoeudImprimer
                  key={racine.personne.id}
                  noeud={racine}
                  couleurById={couleurById}
                  racine
                />
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}
