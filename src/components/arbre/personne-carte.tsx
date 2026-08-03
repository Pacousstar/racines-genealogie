"use client";

import Link from "next/link";
import { Star, Heart, Crown } from "lucide-react";
import {
  type Personne,
  initiales,
  nomComplet,
  periode,
  estAncetre,
} from "@/lib/arbre";
import { cn } from "@/lib/utils";

type Props = {
  personne: Personne;
  partenaire?: boolean;
  avecConjoint?: boolean;
};

export default function PersonneCarte({ personne: p, partenaire, avecConjoint }: Props) {
  const mort = p.vivant === false;
  const ancetre = estAncetre(p);

  return (
    <Link
      href={`/tableau/personnes/${p.id}`}
      className={cn(
        "group flex w-36 flex-col items-center gap-1 rounded-lg border-2 bg-white/80 p-2 text-center shadow-sm transition hover:shadow-md",
        mort
          ? "border-neutral-400/70 opacity-80"
          : "border-emerald-700/50 hover:border-emerald-700",
        ancetre && !mort && "border-amber-500/80",
        partenaire && "scale-95 border-dashed"
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-md text-lg font-bold",
          mort ? "bg-neutral-300 text-neutral-600" : "bg-emerald-800 text-white"
        )}
      >
        {p.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.photo_url}
            alt={nomComplet(p)}
            className={cn(
              "h-full w-full rounded-md object-cover",
              mort && "grayscale"
            )}
          />
        ) : (
          initiales(p)
        )}
      </div>
      <div className="flex min-h-9 flex-col items-center justify-center">
        <span className="text-sm font-bold leading-tight">{nomComplet(p)}</span>
        {p.surnom && (
          <span className="text-xs italic opacity-70">« {p.surnom} »</span>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs opacity-80">
        {p.sexe && <span>{p.sexe === "M" ? "♂" : "♀"}</span>}
        <span>{periode(p)}</span>
      </div>
      {(ancetre || p.fiabilite === "probable") && (
        <div className="flex items-center gap-1">
          {ancetre && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              <Star className="h-3 w-3" aria-hidden /> Ancêtre
            </span>
          )}
          {p.est_fondateur === true && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
              <Crown className="h-3 w-3" aria-hidden /> Fondateur
            </span>
          )}
          {p.fiabilite === "probable" && (
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
              probable
            </span>
          )}
        </div>
      )}
      {!partenaire && avecConjoint && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700">
          <Heart className="h-3 w-3" aria-hidden /> uni(e)
        </span>
      )}
    </Link>
  );
}