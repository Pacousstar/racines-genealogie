"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Mic, Square, Loader2, Play, Trash2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import RecherchePersonne, {
  type ResultatPersonne,
} from "@/components/saisie/recherche-personne";
import { insererTemoignage } from "./actions";
import { nomComplet, periode } from "@/lib/arbre";
import NavigationBas from "@/components/mobile/navigation-bas";
import Logo from "@/components/branding/logo";

type Temoignage = {
  id: string;
  titre: string | null;
  audio_url: string;
  duree: number | null;
  cree_le: string | null;
};

function dureeTexte(secondes: number | null): string {
  if (!secondes) return "";
  const m = Math.floor(secondes / 60);
  const s = Math.round(secondes % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function tempsCourant(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function TemoignagePage() {
  const [personne, setPersonne] = useState<ResultatPersonne | null>(null);
  const [temoignages, setTemoignages] = useState<Temoignage[]>([]);
  const [chargement, setChargement] = useState(false);
  const [tableManquante, setTableManquante] = useState(false);
  const [enregistre, setEnregistre] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [titre, setTitre] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const pistesRef = useRef<Blob[]>([]);
  const intervalleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const charger = async (id: string) => {
    setChargement(true);
    setTableManquante(false);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("temoignages")
      .select("id,titre,audio_url,duree,cree_le")
      .eq("personne_id", id)
      .order("cree_le", { ascending: false });
    setChargement(false);
    if (error) {
      if (/does not exist|could not find/i.test(error.message)) {
        setTableManquante(true);
      } else {
        toast.error(`Lecture impossible : ${error.message}`);
      }
      setTemoignages([]);
      return;
    }
    setTemoignages((data ?? []) as Temoignage[]);
  };

  const choisirPersonne = (p: ResultatPersonne | null) => {
    setPersonne(p);
    setTemoignages([]);
    if (p) void charger(p.id);
  };

  useEffect(() => {
    return () => {
      if (intervalleRef.current) clearInterval(intervalleRef.current);
      if (mediaRef.current && mediaRef.current.state !== "inactive") {
        mediaRef.current.stop();
      }
    };
  }, []);

  const commencer = async () => {
    if (!personne) return;
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const enregistreur = new MediaRecorder(flux);
      mediaRef.current = enregistreur;
      pistesRef.current = [];
      enregistreur.ondataavailable = (e) => {
        if (e.data.size > 0) pistesRef.current.push(e.data);
      };
      enregistreur.onstop = () => {
        flux.getTracks().forEach((t) => t.stop());
      };
      enregistreur.start();
      setEnregistre(true);
      setSecondes(0);
      intervalleRef.current = setInterval(
        () => setSecondes((s) => s + 1),
        1000
      );
    } catch {
      toast.error(
        "Micro inaccessible — autorisez le micro dans le navigateur (réglages de confidentialité)."
      );
    }
  };

  const arreter = async () => {
    const enregistreur = mediaRef.current;
    if (!enregistreur || enregistreur.state === "inactive") return;
    if (intervalleRef.current) clearInterval(intervalleRef.current);
    setEnregistre(false);
    const duree = secondes;
    const flux = enregistreur.stream;
    const fin = new Promise<void>((resolve) => {
      enregistreur.onstop = () => {
        flux.getTracks().forEach((t) => t.stop());
        resolve();
      };
    });
    enregistreur.stop();
    await fin;

    const blob = new Blob(pistesRef.current, {
      type: enregistreur.mimeType || "audio/webm",
    });
    if (blob.size === 0) {
      toast.error("Enregistrement vide — réessayez.");
      return;
    }
    if (!personne) return;

    setEnvoi(true);
    try {
      const supabase = createClient();
      const nom = `audio/${personne.id}/${Date.now()}.webm`;
      const { error: errUpload } = await supabase.storage
        .from("photos")
        .upload(nom, blob, { contentType: blob.type || "audio/webm" });
      if (errUpload) {
        toast.error(`Envoi impossible : ${errUpload.message}`);
        return;
      }
      const res = await insererTemoignage({
        personne_id: personne.id,
        titre: titre.trim() || `Témoignage enregistré à ${tempsCourant()}`,
        audio_url: nom,
        duree,
      });
      if (res.erreur) {
        toast.error(res.erreur);
        return;
      }
      toast.success("Témoignage enregistré dans la généalogie.");
      setTitre("");
      await charger(personne.id);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="flex items-center gap-3 px-4 pt-4">
        <Logo />
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight text-white">
            Témoignage audio
          </h1>
          <p className="text-xs text-white/75">
            Enregistrer un récit de famille
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-5">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-base font-bold text-blue-900">
            1 · À qui est ce témoignage ?
          </h2>
          <RecherchePersonne
            label=""
            placeholder="Chercher la personne…"
            valeurInitiale={null}
            onChange={choisirPersonne}
          />
          {personne && (
            <p className="mt-2 rounded-lg bg-emerald-700/10 px-3 py-2 text-sm font-medium text-emerald-900">
              Témoignage au sujet de {nomComplet(personne)}{" "}
              <span className="opacity-70">· {periode(personne)}</span>
            </p>
          )}
        </section>

        {tableManquante && (
          <p className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-100">
            La table des témoignages n&apos;existe pas encore. Lancez la
            migration <code>scripts/migrations/temoignages.sql</code> dans
            l&apos;éditeur SQL de Supabase, puis rechargez.
          </p>
        )}

        {personne && (
          <section className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-blue-900">
              2 · Enregistrement
            </h2>
            {!enregistre ? (
              <button
                type="button"
                onClick={() => void commencer()}
                disabled={envoi}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition active:scale-95 disabled:opacity-60"
                aria-label="Commencer l'enregistrement"
              >
                <Mic className="h-9 w-9" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void arreter()}
                className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition active:scale-95"
                aria-label="Arrêter l'enregistrement"
              >
                <Square className="h-8 w-8" aria-hidden />
              </button>
            )}
            <p className="text-sm text-neutral-600">
              {enregistre ? (
                <span className="inline-flex items-center gap-2 font-semibold text-red-700">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
                  Enregistrement… {dureeTexte(secondes)}
                </span>
              ) : (
                "Touchez le micro, parlez, touchez le carré pour terminer."
              )}
            </p>
            {!enregistre && !envoi && (
              <label className="flex w-full flex-col gap-1 text-sm">
                <span className="font-medium text-neutral-700">
                  Titre (facultatif)
                </span>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex. « Récit de l'arrivée de mon père à Toa-Zéo »"
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-base"
                />
              </label>
            )}
            {envoi && (
              <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Envoi et enregistrement…
              </p>
            )}
          </section>
        )}

        {personne && temoignages.length > 0 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-blue-900">
              <Play className="h-4 w-4 text-emerald-700" aria-hidden />
              Témoignages de {nomComplet(personne)}{" "}
              <span className="rounded-full bg-emerald-700/10 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {temoignages.length}
              </span>
            </h2>
            {chargement && (
              <p className="py-2 text-sm text-neutral-500">Chargement…</p>
            )}
            <ul className="flex flex-col gap-3">
              {temoignages.map((t) => (
                <li key={t.id} className="rounded-xl border border-neutral-200 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-blue-900">
                      {t.titre ?? "Témoignage"}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-neutral-500">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {dureeTexte(t.duree)}
                    </span>
                  </div>
                  <audio
                    controls
                    preload="none"
                    src={`/audio?t=${encodeURIComponent(t.audio_url)}`}
                    className="w-full"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {personne && !tableManquante && !chargement && temoignages.length === 0 && (
          <p className="rounded-2xl bg-white/15 p-4 text-sm text-white/85">
            Aucun témoignage pour l&apos;instant — le premier récit peut être
            enregistré ci-dessus.
          </p>
        )}
      </main>

      <NavigationBas />
    </div>
  );
}