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
import {
  COULEURS_QUARTIERS,
  type CouleurQuartier,
  TINTE,
  BORDES,
  PUCES_BORDURE,
  CHIPS,
} from "@/lib/couleurs-quartiers";

type Props = {
  personnes: Personne[];
  liens: LienEnfant[];
  unions: Union[];
  quartiers: { id: string; nom: string }[];
  familles: { id: string; nom: string; quartier_id: string | null }[];
};

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 2.5;

type MapQuartierFamille = {
  quartierNom: (id: string | null) => string;
  familleNom: (id: string | null) => string;
};

function Noeud({
  noeud,
  liens,
  couleurById,
  surlignes,
  racine = false,
}: {
  noeud: NonNullable<ReturnType<typeof prunerArbre>>;
  liens: MapQuartierFamille;
  couleurById: (id: string | null) => CouleurQuartier | null;
  surlignes: ReadonlySet<string>;
  racine?: boolean;
}) {
  const couleur = couleurById(noeud.personne.quartier_id);
  const nomQuartier = liens.quartierNom(noeud.personne.quartier_id);

  return (
    <li>
      <div className="relative flex justify-center">
        {couleur && nomQuartier ? (
          <span
            className={cn(
              "absolute -top-2 left-0 z-10 inline-flex items-center gap-1.5 rounded-xl border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              CHIPS[couleur]
            )}
          >
            <MapPin className="h-3 w-3" aria-hidden />
            {nomQuartier}
          </span>
        ) : null}
        <div
          className={cn(
            styles.couple,
            couleur && "rounded-2xl border-2 px-3 pb-3 pt-2",
            couleur && BORDES[couleur]
          )}
          data-boite={couleur ? "1" : undefined}
          style={couleur ? { backgroundColor: TINTE[couleur] } : undefined}
        >
          <span
            className={cn(
              styles.attache,
              noeud.enfants.length > 0 && styles.attacheEnfants
            )}
          >
            <PersonneCarte
              personne={noeud.personne}
              quartier={liens.quartierNom(noeud.personne.quartier_id)}
              famille={liens.familleNom(noeud.personne.famille_id)}
              surligne={surlignes.has(noeud.personne.id)}
            />
          </span>
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
                surligne={surlignes.has(noeud.conjoint.id)}
              />
            </>
          )}
        </div>
      </div>
      {noeud.autresConjoints.length > 0 && (
        <div className={styles.couplesAutres}>
          <span className={styles.etiquetteAutres}>
            Conjoint(e)s secondaires — leurs enfants à part
          </span>
          <div className={styles.blocsAutres}>
            {noeud.autresConjoints.map((autre) => (
              <div key={autre.conjoint.id} className={styles.blocAutre}>
                <div
                  className={cn(
                    styles.couple,
                    couleur && "rounded-2xl border-2 px-2 pb-2 pt-1",
                    couleur && BORDES[couleur]
                  )}
                  style={couleur ? { backgroundColor: TINTE[couleur] } : undefined}
                >
                  <span
                    className={cn(
                      styles.attache,
                      autre.enfants.length > 0 && styles.attacheEnfants
                    )}
                  >
                    <PersonneCarte
                      personne={noeud.personne}
                      quartier={liens.quartierNom(noeud.personne.quartier_id)}
                      famille={liens.familleNom(noeud.personne.famille_id)}
                      surligne={surlignes.has(noeud.personne.id)}
                    />
                  </span>
                  <div className={styles.union} aria-hidden>
                    <span className={styles.trait} />
                    <span className={styles.symbole}>⚭</span>
                    <span className={styles.trait} />
                  </div>
                  <PersonneCarte
                    personne={autre.conjoint}
                    quartier={liens.quartierNom(autre.conjoint.quartier_id)}
                    famille={liens.familleNom(autre.conjoint.famille_id)}
                    surligne={surlignes.has(autre.conjoint.id)}
                  />
                </div>
                {autre.enfants.length > 0 && (
                  <ul className={styles.arbre}>
                    {autre.enfants.map((enfant) => (
                      <Noeud
                        key={enfant.personne.id}
                        noeud={enfant}
                        liens={liens}
                        couleurById={couleurById}
                        surlignes={surlignes}
                      />
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {noeud.enfants.length === 0 && !noeud.conjoint && racine && (
        <p className="mt-3 max-w-56 text-xs opacity-70">
          Aucun lien descendant déclaré pour cette personne. Reliez ses enfants
          : «&nbsp;Modifier&nbsp;» → « Enfants » → « Ajouter un enfant ».
        </p>
      )}
      {noeud.enfants.length > 0 && (
        <ul className={styles.arbre}>
          {noeud.enfants.map((enfant) => (
            <Noeud
              key={enfant.personne.id}
              noeud={enfant}
              liens={liens}
              couleurById={couleurById}
              surlignes={surlignes}
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

  const surlignes = useMemo(() => {
    const ids = new Set<string>();
    const terme = filtre.chercher.trim();
    if (!terme) return ids;
    for (const p of personnes) {
      if (matchPersonne(p, { ...filtre, chercher: terme })) ids.add(p.id);
    }
    return ids;
  }, [personnes, filtre]);

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
    <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border-2 border-emerald-600 bg-white p-4">
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
          {surlignes.size > 0 && (
            <span className="pointer-events-none absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
              {surlignes.size}
            </span>
          )}
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
        className="min-h-0 flex-1 overflow-auto rounded-xl border-2 border-emerald-200 bg-white p-4"
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
                <ul className={styles.arbre} data-racines>
                  {arbreFiltre.map((racine) => (
                    <Noeud
                      key={racine.personne.id}
                      noeud={racine}
                      liens={labels}
                      couleurById={labels.couleurById}
                      surlignes={surlignes}
                      racine
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