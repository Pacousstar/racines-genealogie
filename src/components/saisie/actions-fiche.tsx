"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Pencil, Trash2, Loader2, TriangleAlert } from "lucide-react";
import { supprimer, type PersonneRestante } from "@/app/tableau/personnes/actions";

export default function ActionsFiche({ id }: { id: string }) {
  const router = useRouter();
  const [confirme, setConfirme] = useState(false);
  const [restants, setRestants] = useState<PersonneRestante[] | null>(null);
  const [pending, startTransition] = useTransition();

  const lancerSuppression = (aussiIds: string[] = []) => {
    startTransition(async () => {
      const res = await supprimer(id, aussiIds);
      if (res.erreur) {
        toast.error(res.erreur);
        setConfirme(false);
        return;
      }
      if (res.restants && res.restants.length > 0) {
        setRestants(res.restants);
        setConfirme(false);
        return;
      }
      toast.success("Personne supprimée du tableau.");
      router.push("/tableau");
      router.refresh();
    });
  };

  if (restants && restants.length > 0) {
    return (
      <div className="mt-4 rounded-xl border border-amber-500/50 bg-amber-50 p-4">
        <p className="flex items-start gap-2 text-sm font-semibold text-amber-900">
          <TriangleAlert className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden />
          Ces personnes n&apos;auront plus aucun lien dans le tableau :
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {restants.map((r) => (
            <li
              key={r.id}
              className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-amber-900 shadow-sm"
            >
              {[r.prenom, r.nom].filter(Boolean).join(" ")}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => lancerSuppression(restants.map((r) => r.id))}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Les supprimer aussi
          </button>
          <button
            type="button"
            onClick={() => {
              toast.success("Personne supprimée du tableau.");
              router.push("/tableau");
              router.refresh();
            }}
            disabled={pending}
            className="rounded-lg border border-current/20 px-4 py-2 text-sm font-medium transition hover:bg-current/10 disabled:opacity-60"
          >
            Non, les garder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Link
        href={`/tableau/personnes/${id}/modifier`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-4 py-2 text-sm font-semibold transition hover:bg-current/10"
      >
        <Pencil className="h-4 w-4" aria-hidden /> Modifier
      </Link>

      {confirme ? (
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-red-800">
            Supprimer définitivement ?
          </span>
          <button
            type="button"
            onClick={() => lancerSuppression()}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Oui, supprimer
          </button>
          <button
            type="button"
            onClick={() => setConfirme(false)}
            disabled={pending}
            className="rounded-lg border border-current/20 px-4 py-2 text-sm font-medium transition hover:bg-current/10 disabled:opacity-60"
          >
            Annuler
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirme(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" aria-hidden /> Supprimer
        </button>
      )}
    </div>
  );
}