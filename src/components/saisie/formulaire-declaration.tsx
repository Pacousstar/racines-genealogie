"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, RotateCcw, Loader2 } from "lucide-react";
import { declarer } from "@/app/tableau/declarer/actions";
import RecherchePersonne from "@/components/saisie/recherche-personne";

type Options = {
  quartiers: { id: string; nom: string }[];
  familles: { id: string; nom: string; quartier_id: string | null }[];
};

const SOURCES = ["Témoignage du CHO", "Registre", "Document", "Autre"];
const FIABILITES = ["confirmé", "probable", "en cours"];

function Radio({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
        checked
          ? "border-emerald-700 bg-emerald-700 text-white"
          : "border-current/20 hover:bg-current/5"
      }`}
    >
      {label}
    </button>
  );
}

export default function FormulaireDeclaration({ options }: { options: Options }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [surnom, setSurnom] = useState("");
  const [sexe, setSexe] = useState<"M" | "F" | null>(null);
  const [vivant, setVivant] = useState(true);
  const [dateNaissance, setDateNaissance] = useState("");
  const [dateDeces, setDateDeces] = useState("");
  const [quartierId, setQuartierId] = useState("");
  const [familleId, setFamilleId] = useState("");
  const [source, setSource] = useState("Témoignage du CHO");
  const [fiabilite, setFiabilite] = useState("confirmé");
  const [provisoireParents, setProvisoireParents] = useState(false);
  const [pereId, setPereId] = useState<string | null>(null);
  const [mereId, setMereId] = useState<string | null>(null);
  const [conjointId, setConjointId] = useState<string | null>(null);

  const famillesFiltrees = useMemo(() => {
    if (!quartierId) return options.familles;
    return options.familles.filter((f) => f.quartier_id === quartierId);
  }, [options.familles, quartierId]);

  const soumettre = () => {
    if (!nom.trim()) {
      toast.error("Le nom est obligatoire.");
      return;
    }
    startTransition(async () => {
      const res = await declarer({
        nom,
        prenom,
        surnom,
        sexe,
        vivant,
        date_naissance: dateNaissance,
        date_deces: dateDeces,
        quartier_id: quartierId || null,
        famille_id: familleId || null,
        source,
        fiabilite,
        pere_id: pereId,
        mere_id: mereId,
        conjoint_id: conjointId,
        provisoireParents,
      });
      if (res.erreur) {
        toast.error(res.erreur);
        return;
      }
      if (res.id) {
        toast.success("Personne enregistrée dans le tableau.");
        router.push(`/tableau/personnes/${res.id}`);
        router.refresh();
      }
    });
  };

  const reinit = () => {
    setNom("");
    setPrenom("");
    setSurnom("");
    setSexe(null);
    setVivant(true);
    setDateNaissance("");
    setDateDeces("");
    setQuartierId("");
    setFamilleId("");
    setSource("Témoignage du CHO");
    setFiabilite("confirmé");
    setProvisoireParents(false);
    setPereId(null);
    setMereId(null);
    setConjointId(null);
  };

  const champ = (label: string, value: string, set: (v: string) => void) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        className="rounded-lg border px-3 py-2 text-base"
      />
    </label>
  );

  const selectQuartiers = (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">Quartier</span>
      <select
        value={quartierId}
        onChange={(e) => {
          setQuartierId(e.target.value);
          setFamilleId("");
        }}
        className="rounded-lg border px-3 py-2 text-base"
      >
        <option value="">— Aucun quartier —</option>
        {options.quartiers.map((q) => (
          <option key={q.id} value={q.id}>
            {q.nom}
          </option>
        ))}
      </select>
    </label>
  );

  const selectFamilles = (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">Famille</span>
      <select
        value={familleId}
        onChange={(e) => setFamilleId(e.target.value)}
        className="rounded-lg border px-3 py-2 text-base"
      >
        <option value="">— Aucune famille —</option>
        {famillesFiltrees.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nom}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        soumettre();
      }}
      className="flex flex-col gap-5"
    >
      <fieldset className="rounded-2xl border border-current/10 bg-white/70 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-emerald-800">
          1 · Qui ?
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {champ("Nom *", nom, setNom)}
          {champ("Prénom", prenom, setPrenom)}
          {champ("Surnom", surnom, setSurnom)}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sexe :</span>
            <Radio checked={sexe === "M"} onChange={() => setSexe("M")} label="♂ Homme" />
            <Radio checked={sexe === "F"} onChange={() => setSexe("F")} label="♀ Femme" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Vivant :</span>
            <Radio checked={vivant} onChange={() => setVivant(true)} label="✓ Oui" />
            <Radio checked={!vivant} onChange={() => setVivant(false)} label="Décédé" />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-current/10 bg-white/70 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-emerald-800">
          2 · Dates (texte libre)
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {champ("Naissance (ex. « vers 1890 »)", dateNaissance, setDateNaissance)}
          {!vivant && champ("Décès", dateDeces, setDateDeces)}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-current/10 bg-white/70 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-emerald-800">
          3 · Lieu
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {selectQuartiers}
          {selectFamilles}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-current/10 bg-white/70 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-emerald-800">
          4 · Liens
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <RecherchePersonne label="Père" onChange={(p) => setPereId(p ? p.id : null)} />
          <RecherchePersonne label="Mère" onChange={(p) => setMereId(p ? p.id : null)} />
          <RecherchePersonne
            label="Conjoint(e)"
            onChange={(p) => setConjointId(p ? p.id : null)}
          />
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={provisoireParents}
            onChange={(e) => setProvisoireParents(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Je n&apos;ai pas encore la personne → créer des <em>cartes provisoires</em>{" "}
            « Père/Mère inconnu » (complétées plus tard).
          </span>
        </label>
      </fieldset>

      <fieldset className="rounded-2xl border border-current/10 bg-white/70 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-emerald-800">
          5 · Source & fiabilité
        </legend>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Source :</span>
          {SOURCES.map((s) => (
            <Radio key={s} checked={source === s} onChange={() => setSource(s)} label={s} />
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <span className="font-medium">Fiabilité :</span>
          <select
            value={fiabilite}
            onChange={(e) => setFiabilite(e.target.value)}
            className="rounded-lg border px-3 py-2 text-base"
          >
            {FIABILITES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-base font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-5 w-5" aria-hidden />
          )}
          Ajouter la personne
        </button>
        <button
          type="button"
          onClick={reinit}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg border border-color/20 px-5 py-3 font-medium transition hover:bg-current/5 disabled:opacity-60"
        >
          <RotateCcw className="h-5 w-5" aria-hidden />
          Réinitialiser
        </button>
      </div>
    </form>
  );
}