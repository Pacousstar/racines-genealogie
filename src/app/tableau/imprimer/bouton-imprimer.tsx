"use client";

import { Printer } from "lucide-react";

export default function BoutonImprimer() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-amber-700 px-5 py-2.5 font-bold text-white transition hover:bg-amber-800 print:hidden"
    >
      <Printer className="h-4 w-4" aria-hidden /> Imprimer / PDF
    </button>
  );
}
