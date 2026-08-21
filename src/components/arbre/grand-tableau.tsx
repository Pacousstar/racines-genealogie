"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Search, ZoomIn, ZoomOut, Maximize, RotateCcw, MapPin, Camera } from "lucide-react";
import {
  type Personne,
  type LienEnfant,
  type Union,
  type Filtre,
  FILTRE_VIDE,
  construitArbre,
  matchPersonne,
  prunerArbre,
  descendantsDe,
  ascendantsDe,
  clipperGenerations,
} from "@/lib/arbre";
import PersonneCarte from "./personne-carte";
import RecherchePersonne from "@/components/saisie/recherche-personne";
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
  afficherPhoto,
  racine = false,
}: {
  noeud: NonNullable<ReturnType<typeof prunerArbre>>;
  liens: MapQuartierFamille;
  couleurById: (id: string | null) => CouleurQuartier | null;
  surlignes: ReadonlySet<string>;
  afficherPhoto: boolean;
  racine?: boolean;
}) {
  const couleur = couleurById(noeud.personne.quartier_id);
  const nomQuartier = liens.quartierNom(noeud.personne.quartier_id);

  const aPlusieursUnions = noeud.autresConjoints.length > 0;
  const aDesEnfants =
    noeud.enfants.length > 0 ||
    noeud.autresConjoints.some((autre) => autre.enfants.length > 0);
  const groupes = aPlusieursUnions
    ? [
        { conjoint: noeud.conjoint, enfants: noeud.enfants },
        ...noeud.autresConjoints.map((autre) => ({
          conjoint: autre.conjoint,
          enfants: autre.enfants,
        })),
      ]
    : [];

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
              aDesEnfants && styles.attacheEnfants
            )}
          >
            <PersonneCarte
              personne={noeud.personne}
              quartier={liens.quartierNom(noeud.personne.quartier_id)}
              famille={liens.familleNom(noeud.personne.famille_id)}
              surligne={surlignes.has(noeud.personne.id)}
              afficherPhoto={afficherPhoto}
            />
          </span>
          {!aPlusieursUnions && noeud.conjoint && (
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
                afficherPhoto={afficherPhoto}
              />
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
                    <PersonneCarte
                      personne={groupe.conjoint}
                      quartier={liens.quartierNom(groupe.conjoint.quartier_id)}
                      famille={liens.familleNom(groupe.conjoint.famille_id)}
                      surligne={surlignes.has(groupe.conjoint.id)}
                      afficherPhoto={afficherPhoto}
                    />
                  </span>
                )}
              </div>
              {groupe.enfants.length > 0 && (
                <ul className={styles.arbre}>
                  {groupe.enfants.map((enfant) => (
                    <Noeud
                      key={enfant.personne.id}
                      noeud={enfant}
                      liens={liens}
                      couleurById={couleurById}
                      surlignes={surlignes}
                      afficherPhoto={afficherPhoto}
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
                <Noeud
                  key={enfant.personne.id}
                  noeud={enfant}
                  liens={liens}
                  couleurById={couleurById}
                  surlignes={surlignes}
                  afficherPhoto={afficherPhoto}
                />
              ))}
            </ul>
          )}
          {noeud.enfants.length === 0 && !noeud.conjoint && racine && (
            <p className="mt-3 max-w-56 text-xs opacity-70">
              Aucun lien descendant déclaré pour cette personne. Reliez ses
              enfants : «&nbsp;Modifier&nbsp;» → « Enfants » → « Ajouter un
              enfant ».
            </p>
          )}
        </>
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
  const [afficherPhotos, setAfficherPhotos] = useState(true);
  const [generations, setGenerations] = useState("toutes");
  const [mode, setMode] = useState<"foret" | "descendance" | "ascendance">("foret");
  const [modeId, setModeId] = useState<string | null>(null);

  const conteneurRef = useRef<HTMLDivElement>(null);
  const arbreRef = useRef<HTMLDivElement>(null);
  const glisseRef = useRef<{
    x: number;
    y: number;
    sx: number;
    sy: number;
    deplace: boolean;
  } | null>(null);
  const ancreRef = useRef<{ px: number; py: number; cx: number; cy: number } | null>(
    null
  );
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Pincement à deux doigts : deux pointeurs simultanés sur la zone.
  const pointRefs = useRef(new Map<number, { x: number; y: number }>());
  const pinceRef = useRef<{
    distance: number;
    zoom0: number;
    px: number;
    py: number;
    cx: number;
    cy: number;
  } | null>(null);

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
    const modeIds =
      mode === "descendance" && modeId
        ? descendantsDe(modeId, liens)
        : mode === "ascendance" && modeId
          ? ascendantsDe(modeId, liens)
          : null;
    const match = (p: Personne) =>
      matchPersonne(p, filtre) &&
      (!modeIds || p.id === modeId || modeIds.has(p.id));
    const prunes = arbre
      .map((r) => prunerArbre(r, match))
      .filter((n): n is NonNullable<typeof n> => n !== null);
    if (generations !== "toutes") {
      const max = Number(generations) - 1;
      return prunes.map((n) => clipperGenerations(n, max));
    }
    return prunes;
  }, [arbre, filtre, mode, modeId, generations, liens]);

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
    // Sur téléphone, on ne réduit jamais sous 100 % : l'arbre se parcourt
    // au doigt (drag) plutôt que d'être illisible en miniature.
    const plancher = window.innerWidth < 768 ? 1 : ZOOM_MIN;
    const s = Math.min(
      1,
      (c.clientWidth - 40) / dimensions.w,
      (c.clientHeight - 40) / dimensions.h
    );
    setZoom(Math.max(plancher, Math.min(ZOOM_MAX, s)));
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

  // Sur mobile, à zoom 100 %, l'arbre est plus large que l'écran : on centre
  // la vue sur la première racine (généralement l'ancêtre ★) au lieu de
  // laisser l'utilisateur face au bord gauche vide.
  useEffect(() => {
    if (window.innerWidth >= 768 || zoom !== 1) return;
    const c = conteneurRef.current;
    if (!c) return;
    const premier = c.querySelector("ul[data-racines] > li");
    if (!premier) return;
    const pr = premier.getBoundingClientRect();
    const cr = c.getBoundingClientRect();
    c.scrollLeft = Math.max(
      0,
      pr.left - cr.left + pr.width / 2 - c.clientWidth / 2
    );
  }, [arbreFiltre, zoom, dimensions]);

  // Zoom molette (Ctrl+molette), centré sur le curseur. Écouteur natif non
  // passif : React attache les événements wheel en passif par défaut.
  useEffect(() => {
    const c = conteneurRef.current;
    if (!c) return;
    const surMolette = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const nouveau = Math.max(
        ZOOM_MIN,
        Math.min(ZOOM_MAX, zoom * Math.exp(-e.deltaY * 0.0025))
      );
      if (nouveau === zoom) return;
      const rect = c.getBoundingClientRect();
      ancreRef.current = {
        px: (c.scrollLeft + e.clientX - rect.left) / zoom,
        py: (c.scrollTop + e.clientY - rect.top) / zoom,
        cx: e.clientX - rect.left,
        cy: e.clientY - rect.top,
      };
      setAjustementAuto(false);
      setZoom(nouveau);
    };
    c.addEventListener("wheel", surMolette, { passive: false });
    return () => c.removeEventListener("wheel", surMolette);
  }, [zoom]);

  // Après le zoom molette, replace le point sous le curseur au même endroit.
  useLayoutEffect(() => {
    const a = ancreRef.current;
    const c = conteneurRef.current;
    if (!a || !c) return;
    ancreRef.current = null;
    c.scrollLeft = a.px * zoom - a.cx;
    c.scrollTop = a.py * zoom - a.cy;
  }, [zoom]);

  // Déplacement de l'arbre à la souris ou au doigt (drag) : on déplace les
  // barres de défilement. La capture du pointeur n'est prise qu'après le seuil
  // de glissement, pour ne pas détourner les clics ordinaires des cartes.
  const surPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const c = conteneurRef.current;
    if (!c) return;
    pointRefs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointRefs.current.size === 2) {
      // Second doigt : on bascule en mode pincement, on annule tout drag.
      glisseRef.current = null;
      const [a, b] = [...pointRefs.current.values()];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const rect = c.getBoundingClientRect();
      pinceRef.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        zoom0: zoomRef.current,
        px: (c.scrollLeft + mx - rect.left) / zoomRef.current,
        py: (c.scrollTop + my - rect.top) / zoomRef.current,
        cx: mx - rect.left,
        cy: my - rect.top,
      };
      return;
    }

    if (pinceRef.current) return;
    glisseRef.current = {
      x: e.clientX,
      y: e.clientY,
      sx: c.scrollLeft,
      sy: c.scrollTop,
      deplace: false,
    };
  };

  const surPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = conteneurRef.current;
    if (!c) return;
    const point = pointRefs.current.get(e.pointerId);
    if (!point) return;
    point.x = e.clientX;
    point.y = e.clientY;

    const pince = pinceRef.current;
    if (pince && pointRefs.current.size >= 2) {
      const [a, b] = [...pointRefs.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < 8) return;
      const ratio = distance / pince.distance;
      const nouveau = Math.max(
        ZOOM_MIN,
        Math.min(ZOOM_MAX, pince.zoom0 * ratio)
      );
      if (nouveau === zoomRef.current) return;
      ancreRef.current = {
        px: pince.px,
        py: pince.py,
        cx: pince.cx,
        cy: pince.cy,
      };
      setAjustementAuto(false);
      setZoom(nouveau);
      return;
    }

    const g = glisseRef.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.deplace && Math.hypot(dx, dy) > 4) {
      g.deplace = true;
      c.setPointerCapture(e.pointerId);
    }
    if (g.deplace) {
      c.scrollLeft = g.sx - dx;
      c.scrollTop = g.sy - dy;
    }
  };

  const surPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointRefs.current.delete(e.pointerId);
    if (pointRefs.current.size < 2) pinceRef.current = null;
    const g = glisseRef.current;
    const c = conteneurRef.current;
    if (g?.deplace && c) {
      const stop = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      c.addEventListener("click", stop, { capture: true, once: true });
    }
    glisseRef.current = null;
  };

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
      <div className="flex flex-wrap items-center gap-3 max-lg:flex-nowrap max-lg:overflow-x-auto print:hidden">
        <label className="relative shrink-0">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
            aria-hidden
          />
          <input
            type="search"
            value={filtre.chercher}
            onChange={(e) => setFiltrePartiel({ chercher: e.target.value })}
            placeholder="Rechercher un nom…"
            className="w-44 rounded-lg border px-8 py-2 text-sm sm:w-56"
          />
          {surlignes.size > 0 && (
            <span className="pointer-events-none absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
              {surlignes.size}
            </span>
          )}
        </label>

        <select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as "foret" | "descendance" | "ascendance");
            setModeId(null);
          }}
          className="shrink-0 rounded-lg border px-3 py-2 text-sm"
          aria-label="Mode d'affichage"
        >
          <option value="foret">Forêt complète</option>
          <option value="descendance">Descendance de…</option>
          <option value="ascendance">Ascendance de…</option>
        </select>

        {mode !== "foret" && (
          <div className="w-56 shrink-0">
            <RecherchePersonne
              key={`mode-${mode}-${modeId ?? "vide"}`}
              label=""
              placeholder={
                mode === "descendance"
                  ? "Descendants de… (chercher)"
                  : "Ascendants de… (chercher)"
              }
              valeurInitiale={
                modeId ? personnes.find((p) => p.id === modeId) ?? null : null
              }
              onChange={(p) => setModeId(p?.id ?? null)}
            />
          </div>
        )}

        <select
          value={generations}
          onChange={(e) => setGenerations(e.target.value)}
          className="shrink-0 rounded-lg border px-3 py-2 text-sm"
          aria-label="Filtrer par générations"
        >
          <option value="toutes">Toutes les générations</option>
          <option value="2">2 générations</option>
          <option value="3">3 générations</option>
          <option value="4">4 générations</option>
          <option value="5">5 générations</option>
        </select>

        <button
          type="button"
          onClick={() => setAfficherPhotos((v) => !v)}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition",
            afficherPhotos
              ? "border-emerald-700 bg-emerald-700 text-white"
              : "border-current/20 hover:bg-current/5"
          )}
          title="Afficher ou masquer les photos"
        >
          <Camera className="h-4 w-4" aria-hidden />
          Photos {afficherPhotos ? "✓" : "✕"}
        </button>

        <select
          value={filtre.quartier}
          onChange={(e) => setFiltrePartiel({ quartier: e.target.value })}
          className="shrink-0 rounded-lg border px-3 py-2 text-sm"
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
          className="shrink-0 rounded-lg border px-3 py-2 text-sm"
          aria-label="Filtrer par vivants"
        >
          <option value="tous">Vivants et défunts</option>
          <option value="vivants">Vivants seulement</option>
          <option value="decedes">Défunts seulement</option>
        </select>

        <select
          value={filtre.fiabilite}
          onChange={(e) => setFiltrePartiel({ fiabilite: e.target.value })}
          className="shrink-0 rounded-lg border px-3 py-2 text-sm"
          aria-label="Filtrer par fiabilité"
        >
          <option value="tous">Toutes fiabilités</option>
          <option value="confirmé">Confirmé</option>
          <option value="probable">Probable</option>
          <option value="en cours">En cours</option>
        </select>

        <div className="ml-auto flex shrink-0 items-center gap-1 rounded-lg border p-1 print:hidden">
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
        <div className="hidden flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-80 md:flex print:hidden">
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
        onPointerDown={surPointerDown}
        onPointerMove={surPointerMove}
        onPointerUp={surPointerUp}
        onPointerCancel={surPointerUp}
        className="min-h-0 flex-1 cursor-grab touch-none select-none overflow-auto rounded-xl border-2 border-emerald-200 bg-white p-2 active:cursor-grabbing sm:p-4"
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
                      afficherPhoto={afficherPhotos}
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