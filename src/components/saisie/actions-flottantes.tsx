"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X, Pencil, UserPlus, Heart, Baby } from "lucide-react";

export default function ActionsFlottantes({ id }: { id: string }) {
  const [ouvert, setOuvert] = useState(false);

  const actions = [
    {
      href: `/tableau/declarer?parent=${id}`,
      label: "Ajouter un enfant",
      detail: "À cette personne",
      Icon: Baby,
    },
    {
      href: `/tableau/declarer?conjoint=${id}`,
      label: "Ajouter un(e) conjoint(e)",
      detail: "Relié(e) à cette personne",
      Icon: Heart,
    },
    {
      href: `/tableau/declarer?enfant=${id}`,
      label: "Ajouter un parent",
      detail: "Cette personne comme enfant",
      Icon: UserPlus,
    },
    {
      href: `/tableau/personnes/${id}/modifier`,
      label: "Modifier la fiche",
      detail: "Compléter les informations",
      Icon: Pencil,
    },
  ];

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 md:hidden">
      {ouvert && (
        <div className="flex flex-col gap-2">
          {actions.map(({ href, label, detail, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOuvert(false)}
              className="flex w-64 items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-lg transition active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                <Icon className="h-4.5 w-4.5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-blue-900">
                  {label}
                </span>
                <span className="block truncate text-xs text-neutral-500">
                  {detail}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-label={ouvert ? "Fermer les actions" : "Actions sur cette personne"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xl transition active:scale-95"
      >
        {ouvert ? (
          <X className="h-7 w-7" aria-hidden />
        ) : (
          <Plus className="h-7 w-7" aria-hidden />
        )}
      </button>
    </div>
  );
}