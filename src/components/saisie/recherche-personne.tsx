"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { nomComplet, periode } from "@/lib/arbre";

export type ResultatPersonne = {
  id: string;
  nom: string;
  prenom: string | null;
  sexe: string | null;
  date_naissance: string | null;
  date_deces: string | null;
  vivant: boolean | null;
};

type Props = {
  label: string;
  placeholder?: string;
  onChange: (p: ResultatPersonne | null) => void;
};

export default function RecherchePersonne({
  label,
  placeholder = "Chercher un nom…",
  onChange,
}: Props) {
  const [q, setQ] = useState("");
  const [resultats, setResultats] = useState<ResultatPersonne[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState(false);
  const [choisi, setChoisi] = useState<ResultatPersonne | null>(null);
  const racineRef = useRef<HTMLDivElement>(null);

useEffect(() => {
    if (choisi) return;
    const terme = q.trim();
    if (!terme) return;
    const token = setTimeout(async () => {
      setRecherche(true);
      const supabase = createClient();
      const si = q.trim().replace(/[%_]/g, "");
      const { data, error } = await supabase
        .from("personnes")
        .select("id,nom,prenom,sexe,date_naissance,date_deces,vivant")
        .or(`nom.ilike.%${si}%,prenom.ilike.%${si}%`)
        .order("nom")
        .limit(10);
      setRecherche(false);
      if (error) return;
      setResultats((data ?? []) as ResultatPersonne[]);
      setOuvert(true);
    }, 250);
    return () => clearTimeout(token);
  }, [q, choisi]);

  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => {
      if (!racineRef.current?.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, [ouvert]);

  const choisir = (p: ResultatPersonne) => {
    setChoisi(p);
    setQ("");
    setOuvert(false);
    onChange(p);
  };

  const effacer = () => {
    setChoisi(null);
    onChange(null);
  };

  return (
    <div ref={racineRef} className="relative">
      <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
        {label}
      </span>

      {choisi ? (
        <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-emerald-700 bg-emerald-700/10 px-3 py-2 text-sm">
          <span className="truncate font-medium">
            {nomComplet(choisi)}{" "}
            <span className="opacity-60">
              · {choisi.sexe === "M" ? "♂" : choisi.sexe === "F" ? "♀" : ""}{" "}
              {periode(choisi)}
            </span>
          </span>
          <button
            type="button"
            onClick={effacer}
            className="rounded p-0.5 transition hover:bg-current/10"
            aria-label="Retirer"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : (
        <>
          <div className="relative mt-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
              aria-hidden
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => resultats.length > 0 && setOuvert(true)}
              placeholder={placeholder}
              className="w-full rounded-lg border px-8 py-2 text-sm"
            />
            {recherche && (
              <span className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
          </div>
          {ouvert && q.trim() && resultats.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-white shadow-lg">
              {resultats.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choisir(r)}
                    className="w-full px-3 py-2 text-left text-sm transition hover:bg-emerald-700/10"
                  >
                    <span className="font-medium">{nomComplet(r)}</span>
                    <span className="ml-2 text-xs opacity-60">
                      {r.sexe === "M" ? "♂" : r.sexe === "F" ? "♀" : ""} {periode(r)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}