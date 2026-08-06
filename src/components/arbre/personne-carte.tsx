"use client";

import Link from "next/link";
import { Star, Heart, Crown, MapPin } from "lucide-react";
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
  quartier?: string | null;
  famille?: string | null;
  surligne?: boolean;
};

export default function PersonneCarte({
  personne: p,
  partenaire,
  avecConjoint,
  quartier,
  famille,
  surligne,
}: Props) {
  const mort = p.vivant === false;
  const ancetre = estAncetre(p);
  const photoSrc = p.photo_url
    ? p.photo_url.startsWith("http")
      ? p.photo_url
      : `/photo?p=${encodeURIComponent(p.photo_url)}`
    : null;

  return (
    <Link
      href={`/tableau/personnes/${p.id}`}
      className={cn(
        "group relative flex w-40 flex-col gap-1.5 rounded-xl border-2 bg-white/90 p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        mort
          ? "border-neutral-300 opacity-80 grayscale"
          : "border-emerald-700/60 hover:border-emerald-700",
        ancetre && !mort && "border-amber-500 shadow-md",
        partenaire && "border-violet-500/70 bg-violet-50/60 hover:border-violet-600",
        avecConjoint && "border-current/20",
        surligne && "border-amber-500 ring-4 ring-amber-400/70 shadow-lg"
      )}
    >
      {ancetre && (
        <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          <Star className="h-3 w-3" aria-hidden /> Ancêtre
        </span>
      )}

      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-lg text-lg font-bold",
          mort
            ? "bg-neutral-300 text-neutral-600"
            : partenaire
              ? "bg-violet-700 text-white"
              : "bg-emerald-800 text-white"
        )}
        aria-hidden
      >
        {p.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoSrc ?? ""}
            alt={nomComplet(p)}
            className={cn("h-full w-full rounded-lg object-cover", mort && "grayscale")}
          />
        ) : (
          initiales(p)
        )}
      </div>

      <div>
        <div className="text-sm font-bold leading-tight">{nomComplet(p)}</div>
        {p.surnom && (
          <div className="text-xs italic opacity-70">« {p.surnom} »</div>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs opacity-80">
        {p.sexe && <span>{p.sexe === "M" ? "♂" : "♀"}</span>}
        <span>{periode(p)}</span>
      </div>

      {(quartier || famille || p.est_fondateur === true) && (
        <div className="flex max-w-full flex-col items-center gap-0.5 text-[10px] leading-tight">
          {p.est_fondateur === true && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-1.5 py-0.5 font-semibold text-purple-800">
              <Crown className="h-3 w-3" aria-hidden /> Fondateur
            </span>
          )}
          {quartier && (
            <span className="inline-flex items-center gap-0.5 truncate rounded-full bg-current/5 px-1.5 py-0.5 font-medium opacity-75">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              {quartier}
            </span>
          )}
          {famille && (
            <span className="truncate rounded-full bg-current/5 px-1.5 py-0.5 font-medium opacity-75">
              {/^Famille\s+/i.test(famille) ? famille : `Famille ${famille}`}
            </span>
          )}
        </div>
      )}

      {p.fiabilite === "confirmé" && (
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
          ✓ confirmé
        </span>
      )}
      {p.fiabilite === "probable" && (
        <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
          probable
        </span>
      )}
      {!partenaire && avecConjoint && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700">
          <Heart className="h-3 w-3" aria-hidden /> uni(e)
        </span>
      )}
      {surligne && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
          ✓ trouvé
        </span>
      )}
    </Link>
  );
}