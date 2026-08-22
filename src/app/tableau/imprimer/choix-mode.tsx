"use client";

import { useState } from "react";
import { TableProperties, TreePine } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  tableau: React.ReactNode;
  arbre: React.ReactNode;
};

export default function ChoixModeImpression({ tableau, arbre }: Props) {
  const [mode, setMode] = useState<"tableau" | "arbre">("tableau");

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setMode("tableau")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition",
            mode === "tableau"
              ? "bg-amber-700 text-white"
              : "border border-amber-300 text-amber-800 hover:bg-amber-50"
          )}
        >
          <TableProperties className="h-4 w-4" aria-hidden />
          Tableau
        </button>
        <button
          type="button"
          onClick={() => setMode("arbre")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition",
            mode === "arbre"
              ? "bg-amber-700 text-white"
              : "border border-amber-300 text-amber-800 hover:bg-amber-50"
          )}
        >
          <TreePine className="h-4 w-4" aria-hidden />
          Arbre
        </button>
      </div>

      {mode === "tableau" ? tableau : arbre}
    </div>
  );
}
