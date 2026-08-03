"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Search, ZoomIn, ZoomOut, Maximize, RotateCcw, MapPin } from "lucide-react";
import {
  type Personne,
  type LienEnfant,
  type Union,
  type Filtre,
  FILTRE_VIDE,
  construitArbre,
  matchPersonne,
  prunerArbre,
} from "@/lib/arbre";
import PersonneCarte from "./personne-carte";
import styles from "./arbre.module.css";
import { cn } from "@/lib/utils";

type Props = {
  personnes: Personne[];
  liens: LienEnfant[];
  unions: Union[];
  quartiers: { id: string; nom: string }[];
  familles: { id: string; nom: string; quartier_id: string | null }[];
};

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 2.5;

const COULEURS_QUARTIERS = [
  "emerald",
  "sky",
  "amber",
  "violet",
  "rose",
  "teal",
  "orange",
  "blue",
] as const;

type CouleurQuartier = (typeof COULEURS_QUARTIERS)[number];

const TINTE: Record<CouleurQuartier, string> = {
  emerald: "rgba(5, 150, 105, 0.07)",
  sky: "rgba(2, 132, 199, 0.07)",
  amber: "rgba(217, 119, 6, 0.07)",
  violet: "rgba(124, 58, 237, 0.07)",
  rose: "rgba(225, 29, 72, 0.07)",
  teal: "rgba(13, 148, 136, 0.07)",
  orange: "rgba(234, 88, 12, 0.07)",
  blue: "rgba(37, 99, 235, 0.07)",
};

const BORDES: Record<CouleurQuartier, string> = {
  emerald: "border-emerald-600/40",
  sky: "border-sky-600/40",
  amber: "border-amber-600/40",
  violet: "border-violet-600/40",
  rose: "border-rose-600/40",
  teal: "border-teal-600/40",
  orange: "border-orange-600/40",
  blue: "border-blue-600/40",
};

const PUCES_BORDURE: Record<CouleurQuartier, string> = {
  emerald: "border-emerald-600/50",
  sky: "border-sky-600/50",
  amber: "border-amber-600/50",
  violet: "border-violet-600/50",
  rose: "border-rose-600/50",
  teal: "border-teal-600/50",
  orange: "border-orange-600/50",
  blue: "border-blue-600/50",
};

const CHIPS: Record<CouleurQuartier, string> = {
  emerald: "border-emerald-600/40 bg-emerald-600/10 text-emerald-800",
  sky: "border-sky-600/40 bg-sky-600/10 text-sky-800",
  amber: "border-amber-600/40 bg-amber-600/10 text-amber-800",
  violet: "border-violet-600/40 bg-violet-600/10 text-violet-800",
  rose: "border-rose-600/40 bg-rose-600/10 text-rose-800",
  teal: "border-teal-600/40 bg-teal-600/10 text-teal-800",
  orange: "border-orange-600/40 bg-orange-600/10 text-orange-800",
  blue: "border-blue-600/40 bg-blue-600/10 text-blue-800",
};

type MapQuartierFamille = {
  quartierNom: (id: string | null) => string;
  familleNom: (id: string | null) => string;
};

function Noeud({
  noeud,
  liens,
  couleurById,
}: {
  noeud: NonNullable<ReturnType<typeof prunerArbre>>;
  liens: MapQuartierFamille;
  couleurById: (id: string | null) => CouleurQuartier | null;
}) {
  const couleur = couleurById(noeud.personne.quartier_id);
  const nomQuartier = liens.quartierNom(noeud.personne.quartier_id);

  return (
    <li>
      {couleur && nomQuartier ? (
        <div
          className={cn(
            "mb-2 inline-flex items-center gap-1.5 rounded-xl border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            CHIPS[couleur]
          )}
        >
          <MapPin className="h-3 w-3" aria-hidden />
          {nomQuartier}
        </div>
      ) : (
        <div className="mb-2" />
      )}
      <div
        className={cn(
          styles.couple,
          couleur && "rounded-2xl border-2 px-3 pb-3 pt-2",
          couleur && BORDES[couleur]
        )}
        style={couleur ? { backgroundColor: TINTE[couleur] } : undefined}
      >
        <PersonneCarte
          personne={noeud.personne}
          quartier={liens.quartierNom(noeud.personne.quartier_id)}
          famille={liens.familleNom(noeud.personne.famille_id)}
        />
        {noeud.conjoint && (
          <>
            <div className={styles.union} aria-hidden>
              <span className={styles.trait} />
              <span className={styles.symbole}>⚭</span>
              <span className={styles.trait} />
            </div>
            <PersonneCarte
              personne={noeud.conjoint}
              quartier={liens.quartierNom(noeud.conjoint.quartier_id)}
              famille={liens.familleNom(noeud.conjoint.famille_id)}
            />
          </>
        )}
      </div>
      {noeud.enfants.length > 0 && (
        <ul className={styles.arbre}>
          {noeud.enfants.map((enfant) => (
            <Noeud
              key={enfant.personne.id}
              noeud={enfant}
              liens={liens}
              couleurById={couleurById}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function GrandTableau({
  personnes,
  liens,
  unions,
  quartiers,
  familles,
}: Props) {
  const [filtre, setFiltre] = useState<Filtre>(FILTRE_VIDE);
  const [zoom, setZoom] = useState(1);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const [ajustementAuto, setAjustementAuto] = useState(true);

  const conteneurRef = useRef<HTMLDivElement>(null);
  const arbreRef = useRef<HTMLDivElement>(null);

  const arbre = useMemo(
    () => construitArbre(personnes, liens, unions),
    [personnes, liens, unions]
  );

  const labels = useMemo(() => {
    const quartiersParId = new Map(quartiers.map((q) => [q.id, q.nom]));
    const famillesParId = new Map(familles.map((f) => [f.id, f.nom]));
    const couleurById = (id: string | null): CouleurQuartier | null => {
      if (!id) return null;
      const index = quartiers.findIndex((q) => q.id === id);
      return index >= 0 ? COULEURS_QUARTIERS[index % COULEURS_QUARTIERS.length] : null;
    };
    return {
      quartierNom: (id: string | null) => (id ? quartiersParId.get(id) ?? "" : ""),
      familleNom: (id: string | null) => (id ? famillesParId.get(id) ?? "" : ""),
      couleurById,
    };
  }, [quartiers, familles]);

  const arbreFiltre = useMemo(() => {
    const match = (p: Personne) => matchPersonne(p, filtre);
    return arbre
      .map((r) => prunerArbre(r, match))
      .filter((n): n is NonNullable<typeof n> => n !== null);
  }, [arbre, filtre]);

  const mesurer = useCallback(() => {
    const el = arbreRef.current;
    if (!el) return;
    setDimensions({ w: el.scrollWidth, h: el.scrollHeight });
  }, []);

  useLayoutEffect(() => {
    mesurer();
  }, [arbreFiltre, mesurer]);

  const ajuster = useCallback(() => {
    const c = conteneurRef.current;
    if (!c || dimensions.w === 0) return;
    const s = Math.min(
      1,
      (c.clientWidth - 40) / dimensions.w,
      (c.clientHeight - 40) / dimensions.h
    );
    setZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, s)));
  }, [dimensions]);

  useEffect(() => {
    if (!ajustementAuto) return;
    ajuster();
  }, [dimensions, ajustementAuto, ajuster]);

  useEffect(() => {
    if (!ajustementAuto) return;
    window.addEventListener("resize", ajuster);
    return () => window.removeEventListener("resize", ajuster);
  }, [ajustementAuto, ajuster]);

  const setFiltrePartiel = (partiel: Partial<Filtre>) =>
    setFiltre((f) => ({ ...f, ...partiel }));

  const changerZoom = (multiplicateur: number) => {
    setAjustementAuto(false);
    setZoom((z) =>
      Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round((z + multiplicateur) * 10) / 10))
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
            aria-hidden
          />
          <input
            type="search"
            value={filtre.chercher}
            onChange={(e) => setFiltrePartiel({ chercher: e.target.value })}
            placeholder="Rechercher un nom…"
            className="w-56 rounded-lg border px-8 py-2 text-sm"
          />
        </label>

        <select
          value={filtre.quartier}
          onChange={(e) => setFiltrePartiel({ quartier: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm"
          aria-label="Filtrer par quartier"
        >
          <option value="tous">Tous les quartiers</option>
          {quartiers.map((q) => (
            <option key={q.id} value={q.id}>
              {q.nom}
            </option>
          ))}
        </select>

        <select
          value={filtre.vivant}
          onChange={(e) => setFiltrePartiel({ vivant: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm"
          aria-label="Filtrer par vivants"
        >
          <option value="tous">Vivants et défunts</option>
          <option value="vivants">Vivants seulement</option>
          <option value="decedes">Défunts seulement</option>
        </select>

        <select
          value={filtre.fiabilite}
          onChange={(e) => setFiltrePartiel({ fiabilite: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm"
          aria-label="Filtrer par fiabilité"
        >
          <option value="tous">Toutes fiabilités</option>
          <option value="confirmé">Confirmé</option>
          <option value="probable">Probable</option>
          <option value="en cours">En cours</option>
        </select>

        <div className="ml-auto flex items-center gap-1 rounded-lg border p-1">
          <button
            type="button"
            onClick={() => changerZoom(-0.1)}
            className="rounded-md p-1.5 transition hover:bg-current/10"
            aria-label="Zoom arrière"
            title="Zoom arrière"
          >
            <ZoomOut className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              setAjustementAuto(true);
              ajuster();
            }}
            className="rounded-md p-1.5 transition hover:bg-current/10"
            aria-label="Ajuster à l'écran"
            title="Ajuster à l'écran"
          >
            <Maximize className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => changerZoom(0.1)}
            className="rounded-md p-1.5 transition hover:bg-current/10"
            aria-label="Zoom avant"
            title="Zoom avant"
          >
            <ZoomIn className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              setAjustementAuto(false);
              setZoom(1);
            }}
            className="rounded-md p-1.5 transition hover:bg-current/10"
            aria-label="Réinitialiser le zoom"
            title="100 %"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {quartiers.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-80">
          <span className="font-semibold uppercase tracking-wide opacity-60">
            Quartiers&nbsp;:
          </span>
          {quartiers.map((q) => {
            const c = labels.couleurById(q.id);
            return (
              <span
                key={q.id}
                className="inline-flex items-center gap-1.5"
              >
                <span
                  className={cn(
                    "h-3 w-3 rounded-full border-2",
                    c ? PUCES_BORDURE[c] : "border-current/40"
                  )}
                  style={c ? { backgroundColor: TINTE[c] } : undefined}
                />
                {q.nom}
              </span>
            );
          })}
        </div>
      )}

      <div
        ref={conteneurRef}
        className="min-h-0 flex-1 overflow-auto rounded-xl border border-current/10 bg-current/[0.03] p-4"
      >
        <div style={{ width: dimensions.w * zoom, height: dimensions.h * zoom }}>
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: dimensions.w,
              height: dimensions.h,
            }}
          >
            <div ref={arbreRef} className="w-max p-2">
              {arbreFiltre.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm opacity-70">
                  Aucune personne ne correspond à ces filtres.
                </p>
              ) : (
                <ul className={styles.arbre}>
                  {arbreFiltre.map((racine) => (
                    <Noeud
                      key={racine.personne.id}
                      noeud={racine}
                      liens={labels}
                      couleurById={labels.couleurById}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}