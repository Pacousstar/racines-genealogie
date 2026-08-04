"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, Loader2, PencilLine, Check } from "lucide-react";
import toast from "react-hot-toast";
import {
  ajouterQuartier,
  modifierQuartier,
  supprimerQuartier,
} from "./actions";

export type QuartierGestion = { id: string; nom: string; ordre: number };

export default function GestionQuartiers({
  quartiers,
}: {
  quartiers: QuartierGestion[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nouveauNom, setNouveauNom] = useState("");
  const [lignes, setLignes] = useState<Record<string, { nom: string; ordre: string }>>(
    Object.fromEntries(
      quartiers.map((q) => [q.id, { nom: q.nom, ordre: String(q.ordre) }])
    )
  );

  const rafraichir = () => {
    router.refresh();
  };

  const maj = (id: string, patch: Partial<{ nom: string; ordre: string }>) =>
    setLignes((l) => ({ ...l, [id]: { ...l[id], ...patch } }));

  const enregistrer = (id: string) => {
    const { nom, ordre } = lignes[id] ?? {};
    startTransition(async () => {
      const res = await modifierQuartier(id, nom ?? "", Number(ordre ?? 0));
      if (res.erreur) toast.error(res.erreur);
      else {
        toast.success("Quartier enregistré.");
        rafraichir();
      }
    });
  };

  const supprimer = (q: QuartierGestion) => {
    if (
      !window.confirm(
        `Supprimer le quartier « ${q.nom} » ?\n\nSes familles seront supprimées ; les personnes garderont leur fiche mais perdront leur quartier.`
      )
    )
      return;
    startTransition(async () => {
      const res = await supprimerQuartier(q.id);
      if (res.erreur) toast.error(res.erreur);
      else {
        toast.success("Quartier supprimé.");
        rafraichir();
      }
    });
  };

  const ajouter = () => {
    const nom = nouveauNom.trim();
    if (!nom) {
      toast.error("Saisissez un nom de quartier.");
      return;
    }
    startTransition(async () => {
      const res = await ajouterQuartier(nom);
      if (res.erreur) toast.error(res.erreur);
      else {
        toast.success(`Quartier « ${nom} » ajouté.`);
        setNouveauNom("");
        rafraichir();
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {quartiers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-current/25 p-4 text-sm opacity-70">
          Aucun quartier pour l&apos;instant — ajoutez le premier ci-dessous.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {quartiers.map((q) => {
            const ligne = lignes[q.id] ?? { nom: q.nom, ordre: String(q.ordre) };
            return (
              <li
                key={q.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-current/10 bg-white/70 p-3"
              >
                <input
                  type="text"
                  value={ligne.nom}
                  onChange={(e) => maj(q.id, { nom: e.target.value })}
                  className="min-w-40 flex-1 rounded-lg border px-3 py-2 text-sm font-medium"
                  aria-label={`Nom du quartier ${q.nom}`}
                />
                <label className="flex items-center gap-1.5 text-xs opacity-70">
                  Ordre
                  <input
                    type="number"
                    min={1}
                    value={ligne.ordre}
                    onChange={(e) => maj(q.id, { ordre: e.target.value })}
                    className="w-16 rounded-lg border px-2 py-2 text-sm"
                    aria-label={`Ordre du quartier ${q.nom}`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => enregistrer(q.id)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" aria-hidden /> Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => supprimer(q)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-600/40 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-600/10 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Supprimer
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-amber-700/40 bg-amber-100/60 p-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-4 w-4" aria-hidden />
          )}
          Nouveau quartier
        </span>
        <input
          type="text"
          value={nouveauNom}
          onChange={(e) => setNouveauNom(e.target.value)}
          placeholder="Nom du quartier…"
          className="min-w-40 flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={ajouter}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-60"
        >
          <Check className="h-4 w-4" aria-hidden /> Ajouter
        </button>
      </div>

      <p className="flex items-start gap-2 text-xs opacity-60">
        <PencilLine className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Renommer ou réordonner : « Enregistrer ». L&apos;ordre pilote le menu
        du formulaire et la légende de la carte. Supprimer efface aussi les
        familles du quartier (les personnes restent dans le tableau).
      </p>
    </div>
  );
}