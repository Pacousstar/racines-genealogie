"use client";

import { useState } from "react";
import { Trees, UserRound } from "lucide-react";
import type { Personne, LienEnfant, Union } from "@/lib/arbre";
import GrandTableau from "./grand-tableau";
import VueFamille from "./vue-famille";
import { cn } from "@/lib/utils";

type Props = {
  personnes: Personne[];
  liens: LienEnfant[];
  unions: Union[];
  quartiers: { id: string; nom: string }[];
  familles: { id: string; nom: string; quartier_id: string | null }[];
};

export default function Explorateur(props: Props) {
  const [vue, setVue] = useState<"famille" | "arbre">("famille");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex w-fit items-center gap-1 rounded-xl border border-white/20 p-1">
        <button
          type="button"
          onClick={() => setVue("famille")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
            vue === "famille"
              ? "bg-emerald-600 text-white shadow"
              : "text-white/85 hover:bg-white/10"
          )}
        >
          <UserRound className="h-4 w-4" aria-hidden /> Famille proche
        </button>
        <button
          type="button"
          onClick={() => setVue("arbre")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
            vue === "arbre"
              ? "bg-emerald-600 text-white shadow"
              : "text-white/85 hover:bg-white/10"
          )}
        >
          <Trees className="h-4 w-4" aria-hidden /> Arbre complet
        </button>
      </div>

      {vue === "famille" ? (
        <VueFamille {...props} onBasculerArbre={() => setVue("arbre")} />
      ) : (
        <GrandTableau {...props} />
      )}
    </div>
  );
}