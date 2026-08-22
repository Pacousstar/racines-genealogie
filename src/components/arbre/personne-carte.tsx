"use client";

import Link from "next/link";
import { Star, Heart, Crown, MapPin } from "lucide-react";
import {
  type Personne,
  initiales,
  nomComplet,
  periode,
  estAncetre,
  libelleFamille,
} from "@/lib/arbre";
import { cn } from "@/lib/utils";

type Props = {
  personne: Personne;
  partenaire?: boolean;
  avecConjoint?: boolean;
  quartier?: string | null;
  famille?: string | null;
  surligne?: boolean;
  afficherPhoto?: boolean;
};

export default function PersonneCarte({
  personne: p,
  partenaire,
  avecConjoint,
  quartier,
  famille,
  surligne,
  afficherPhoto = true,
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
        "group relative flex w-36 lg:w-44 flex-col gap-1.5 rounded-xl border-2 bg-white p-2 lg:p-3 text-center text-blue-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        ancetre
          ? "border-amber-500 bg-amber-100 shadow-md"
          : mort
            ? "border-neutral-300 opacity-80 grayscale"
            : "border-emerald-700/60 hover:border-emerald-700",
        partenaire && "border-violet-500/70 bg-violet-50/60 hover:border-violet-600",
        avecConjoint && "border-current/20",
        surligne && "border-amber-500 ring-4 ring-amber-400/70 shadow-lg"
      )}
    >
      {ancetre && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-amber-500 px-2.5 py-1 text-sm font-bold text-white shadow">
          <Star className="h-3.5 w-3.5" aria-hidden /> Ancêtre
        </span>
      )}

      <div
        className={cn(
          "flex h-12 w-12 lg:h-16 lg:w-16 items-center justify-center rounded-lg text-lg lg:text-xl font-bold",
          mort && !ancetre
            ? "bg-neutral-300 text-neutral-600"
            : ancetre
              ? "bg-amber-500 text-white"
              : partenaire
                ? "bg-violet-700 text-white"
                : "bg-emerald-800 text-white"
        )}
        aria-hidden
      >
        {afficherPhoto && p.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoSrc ?? ""}
            alt={nomComplet(p)}
            className={cn("h-full w-full rounded-lg object-cover", mort && !ancetre && "grayscale")}
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

      {(quartier || famille || p.est_fondateur === true) && (
        <div className="flex max-w-full flex-col items-center gap-0.5 text-sm leading-tight">
          {p.est_fondateur === true && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 font-semibold text-purple-800">
              <Crown className="h-3.5 w-3.5" aria-hidden /> Fondateur
            </span>
          )}
          {quartier && (
            <span className="inline-flex items-center gap-0.5 truncate rounded-full bg-current/10 px-2 py-0.5 font-medium opacity-95">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {quartier}
            </span>
          )}
          {famille && (
            <span className="truncate rounded-full bg-current/10 px-2 py-0.5 font-medium opacity-95">
              {libelleFamille(famille)}
            </span>
          )}
        </div>
      )}

      {p.fiabilite === "confirmé" && (
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-sm font-semibold text-emerald-800">
          ✓ confirmé
        </span>
      )}
      {p.fiabilite === "probable" && (
        <span className="rounded-full bg-yellow-500/20 px-2.5 py-1 text-sm font-semibold text-yellow-800">
          probable
        </span>
      )}
      {!partenaire && avecConjoint && (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700">
          <Heart className="h-3.5 w-3.5" aria-hidden /> uni(e)
        </span>
      )}
      {surligne && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-sm font-bold text-white">
          ✓ trouvé
        </span>
      )}
    </Link>
  );
}