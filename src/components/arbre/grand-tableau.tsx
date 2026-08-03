"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Search, ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react";
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

type Props = {
  personnes: Personne[];
  liens: LienEnfant[];
  unions: Union[];
  quartiers: { id: string; nom: string }[];
};

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 2.5;

function Noeud({ noeud }: { noeud: NonNullable<ReturnType<typeof prunerArbre>> }) {
  return (
    <li>
      <div className={styles.groupe}>
        <PersonneCarte
          personne={noeud.personne}
          avecConjoint={noeud.conjoint !== null}
        />
        {noeud.conjoint && (
          <div className="flex items-center gap-1 text-xs opacity-60">
            <span className="h-px w-6 bg-current" />
            <span>⚭</span>
          </div>
        )}
        {noeud.conjoint && (
          <PersonneCarte personne={noeud.conjoint} partenaire />
        )}
      </div>
      {noeud.enfants.length > 0 && (
        <ul className={styles.arbre}>
          {noeud.enfants.map((enfant) => (
            <Noeud key={enfant.personne.id} noeud={enfant} />
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
                    <Noeud key={racine.personne.id} noeud={racine} />
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