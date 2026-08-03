"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { supprimer } from "@/app/tableau/personnes/actions";

export default function ActionsFiche({ id }: { id: string }) {
  const router = useRouter();
  const [confirme, setConfirme] = useState(false);
  const [pending, startTransition] = useTransition();

  const lancerSuppression = () => {
    startTransition(async () => {
      const res = await supprimer(id);
      if (res.erreur) {
        toast.error(res.erreur);
        setConfirme(false);
        return;
      }
      toast.success("Personne supprimée du tableau.");
      router.push("/tableau");
      router.refresh();
    });
  };

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
            onClick={lancerSuppression}
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
