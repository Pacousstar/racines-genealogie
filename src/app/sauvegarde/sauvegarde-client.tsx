"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Download, Upload, Loader2, Save, FileJson } from "lucide-react";
import { restaurer } from "./actions";
import Logo from "@/components/branding/logo";

type Comptes = {
  personnes: number;
  liens: number;
  unions: number;
  quartiers: number;
  familles: number;
  temoignages: number;
};

export default function SauvegardeClient({
  courriel,
  comptes,
}: {
  courriel: string | null;
  comptes: Comptes;
}) {
  const [restauration, setRestauration] = useState(false);
  const fichierRef = useRef<HTMLInputElement>(null);

  const telecharger = () => {
    const lien = document.createElement("a");
    lien.href = "/sauvegarde/export";
    lien.download = `racines-toa-zeo-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
  };

  const restaurerFichier = async (fichier: File | null) => {
    if (!fichier) return;
    if (!confirm("Remplacer les données actuelles par celles de ce fichier ? Cette action ajoute et met à jour les enregistrements (elle ne supprime rien).")) {
      return;
    }
    setRestauration(true);
    try {
      const texte = await fichier.text();
      const donnees = JSON.parse(texte);
      const res = await restaurer(donnees);
      if (res.erreur) {
        toast.error(res.erreur);
      } else {
        toast.success(`Sauvegarde restaurée : ${res.nombre ?? 0} enregistrements.`);
        window.location.reload();
      }
    } catch {
      toast.error("Fichier invalide — ce n'est pas une sauvegarde Racines+.");
    } finally {
      setRestauration(false);
      if (fichierRef.current) fichierRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <Logo className="h-12 w-12" />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-blue-900">Sauvegarde complète</h2>
          <p className="truncate text-xs text-neutral-500">{courriel}</p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-bold text-blue-900">
          <Download className="h-4.5 w-4.5 text-emerald-700" aria-hidden />
          Télécharger une copie de toute la base
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          Un fichier avec toutes les personnes, les liens, les unions, les
          quartiers, les familles et les témoignages. Rangez-le en lieu sûr
          (ou sur votre téléphone) — c&apos;est votre garantie contre toute perte.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-500 sm:grid-cols-3">
          <span>{comptes.personnes} personnes</span>
          <span>{comptes.liens} liens</span>
          <span>{comptes.unions} unions</span>
          <span>{comptes.quartiers} quartiers</span>
          <span>{comptes.familles} familles</span>
          <span>{comptes.temoignages} témoignages</span>
        </div>
        <button
          type="button"
          onClick={telecharger}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-800 active:scale-[0.99]"
        >
          <Save className="h-5 w-5" aria-hidden /> Télécharger la sauvegarde
        </button>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-bold text-blue-900">
          <Upload className="h-4.5 w-4.5 text-emerald-700" aria-hidden />
          Restaurer depuis un fichier
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          Utilisé pour remettre les données après une réinstallation ou une
          erreur. La restauration ajoute et met à jour les enregistrements
          (elle ne supprime jamais rien).
        </p>
        <label className="mt-4 flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-4 py-6 text-center">
          <FileJson className="h-8 w-8 text-emerald-600" aria-hidden />
          <span className="text-sm font-semibold text-emerald-800">
            {restauration ? "Restauration en cours…" : "Choisir le fichier de sauvegarde (.json)"}
          </span>
          <input
            ref={fichierRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            disabled={restauration}
            onChange={(e) => void restaurerFichier(e.target.files?.[0] ?? null)}
          />
        </label>
        {restauration && (
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-emerald-800">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Restauration…
          </p>
        )}
      </section>
    </div>
  );
}