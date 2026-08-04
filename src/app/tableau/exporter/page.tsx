import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  FileDown,
  Printer,
  Info,
} from "lucide-react";

export const metadata: Metadata = { title: "Exporter la généalogie" };
export const dynamic = "force-dynamic";

export default async function ExporterPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <Link
        href="/tableau"
        className="inline-flex items-center gap-1.5 text-sm font-medium opacity-80 transition hover:opacity-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Retour au Grand Tableau
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FileDown className="h-6 w-6 text-amber-700" aria-hidden /> Exporter
          la généalogie
        </h1>
        <p className="-mt-1 text-sm opacity-70">
          Sauvegarder ou imprimer le travail du CHO — pour Racines+ et les
          autres logiciels de généalogie.
        </p>
      </div>

      <section className="rounded-2xl border border-current/10 bg-white/70 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700/15 text-emerald-800">
            <FileDown className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold">Fichier GEDCOM 7</h2>
            <p className="text-sm opacity-70">
              Format standard de la généalogie : familles, unions et sources.
              Importable dans <strong>Racines+</strong>, Gramps, Ancestry,
              Geneanet…
            </p>
            <a
              href="/tableau/export-gedcom"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 font-bold text-white transition hover:bg-emerald-800"
            >
              <FileDown className="h-4 w-4" aria-hidden />
              Exporter GEDCOM 7 (.ged)
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-current/10 bg-white/70 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600/15 text-amber-800">
            <Printer className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold">Version papier</h2>
            <p className="text-sm opacity-70">
              Document lisible mis en page par quartier et par famille, prêt à
              imprimer ou à sauvegarder en PDF (imprimeur → « Enregistrer en
              PDF »).
            </p>
            <Link
              href="/tableau/imprimer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-700 px-5 py-2.5 font-bold text-white transition hover:bg-amber-800"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Ouvrir la version imprimable
            </Link>
          </div>
        </div>
      </section>

      <p className="flex items-start gap-2 rounded-xl border border-sky-600/30 bg-sky-600/10 p-3 text-xs text-sky-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        L&apos;export reprend toutes les personnes, unions et liens de la base.
        Après l&apos;import dans Racines+, vérifiez les dates « vers … » qui
        restent des indications.
      </p>
    </main>
  );
}
