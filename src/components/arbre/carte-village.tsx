"use client";

import { useMemo } from "react";
import {
  COULEURS_QUARTIERS,
  type CouleurQuartier,
  FILLS,
  STROKES,
  TEXTES,
} from "@/lib/couleurs-quartiers";
import {
  POSITIONS_QUARTIERS,
  LARGEUR_PLAN,
  HAUTEUR_PLAN,
} from "@/lib/carte-village";

type Props = {
  quartiers: { id: string; nom: string }[];
  familles: { id: string; nom: string; quartier_id: string | null }[];
  personnes: { quartier_id: string | null }[];
};

export default function CarteVillage({ quartiers, familles, personnes }: Props) {
  const zone = useMemo(() => {
    const famillesParQuartier = new Map<string, string[]>();
    for (const f of familles) {
      if (!f.quartier_id) continue;
      const liste = famillesParQuartier.get(f.quartier_id) ?? [];
      liste.push(f.nom);
      famillesParQuartier.set(f.quartier_id, liste);
    }
    const personnesParQuartier = new Map<string, number>();
    for (const p of personnes) {
      if (!p.quartier_id) continue;
      personnesParQuartier.set(
        p.quartier_id,
        (personnesParQuartier.get(p.quartier_id) ?? 0) + 1
      );
    }
    const positionsParNom = new Map(POSITIONS_QUARTIERS.map((p) => [p.nom, p]));
    return quartiers.map((q, index) => {
      const couleur: CouleurQuartier =
        COULEURS_QUARTIERS[index % COULEURS_QUARTIERS.length];
      const pos = positionsParNom.get(q.nom) ?? {
        x: 60 + (index % 4) * 230,
        y: 560 + Math.floor(index / 4) * 170,
        largeur: 200,
        hauteur: 140,
      };
      return {
        ...q,
        couleur,
        pos,
        familles: famillesParQuartier.get(q.id) ?? [],
        nbPersonnes: personnesParQuartier.get(q.id) ?? 0,
      };
    });
  }, [quartiers, familles, personnes]);

  return (
    <div className="overflow-auto rounded-xl border border-current/10 bg-current/[0.03] p-4">
      <svg
        viewBox={`0 0 ${LARGEUR_PLAN} ${HAUTEUR_PLAN}`}
        className="h-auto w-full min-w-[860px]"
        role="img"
        aria-label="Plan du village de Toa-Zéo"
      >
        <rect
          width={LARGEUR_PLAN}
          height={HAUTEUR_PLAN}
          rx={24}
          fill="#faf7f0"
        />
        <rect
          x={20}
          y={20}
          width={LARGEUR_PLAN - 40}
          height={HAUTEUR_PLAN - 40}
          rx={28}
          fill="none"
          stroke="#d6c9a8"
          strokeWidth={2}
          strokeDasharray="8 8"
        />
        <text x={40} y={60} fontSize={28} fontWeight="bold" fill="#7a6a45">
          Toa-Zéo
        </text>

        {zone.map((z) => (
          <g key={z.id}>
            <rect
              x={z.pos.x}
              y={z.pos.y}
              width={z.pos.largeur}
              height={z.pos.hauteur}
              rx={22}
              fill={FILLS[z.couleur]}
              stroke={STROKES[z.couleur]}
              strokeWidth={3}
            />
            <text
              x={z.pos.x + 20}
              y={z.pos.y + 42}
              fontSize={20}
              fontWeight="bold"
              fill={TEXTES[z.couleur]}
            >
              {z.nom}
            </text>
            {z.familles.slice(0, 4).map((f, i) => (
              <text
                key={f}
                x={z.pos.x + 20}
                y={z.pos.y + 70 + i * 22}
                fontSize={14}
                fill={TEXTES[z.couleur]}
              >
                Famille {f}
              </text>
            ))}
            {z.familles.length > 4 && (
              <text
                x={z.pos.x + 20}
                y={z.pos.y + 70 + 4 * 22}
                fontSize={13}
                fill={TEXTES[z.couleur]}
              >
                + {z.familles.length - 4} autres
              </text>
            )}
            <text
              x={z.pos.x + z.pos.largeur - 18}
              y={z.pos.y + z.pos.hauteur - 16}
              fontSize={16}
              fontWeight="bold"
              textAnchor="end"
              fill={STROKES[z.couleur]}
            >
              {z.nbPersonnes} pers.
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
