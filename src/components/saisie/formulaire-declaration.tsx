"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, RotateCcw, Loader2, X } from "lucide-react";
import { declarer } from "@/app/tableau/declarer/actions";
import { modifier } from "@/app/tableau/personnes/actions";
import RecherchePersonne, {
  type ResultatPersonne,
} from "@/components/saisie/recherche-personne";

type Options = {
  quartiers: { id: string; nom: string }[];
  familles: { id: string; nom: string; quartier_id: string | null }[];
};

export type PersonneEdition = {
  id: string;
  nom: string;
  prenom: string | null;
  surnom: string | null;
  sexe: "M" | "F" | null;
  vivant: boolean | null;
  date_naissance: string | null;
  date_deces: string | null;
  quartier_id: string | null;
  famille_id: string | null;
  source: string | null;
  fiabilite: string | null;
  pere: ResultatPersonne | null;
  mere: ResultatPersonne | null;
  conjoint: ResultatPersonne | null;
  enfants: ResultatPersonne[];
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

export default function FormulaireDeclaration({
  options,
  personne,
}: {
  options: Options;
  personne?: PersonneEdition | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const edition = Boolean(personne);

  const [nom, setNom] = useState(personne?.nom ?? "");
  const [prenom, setPrenom] = useState(personne?.prenom ?? "");
  const [surnom, setSurnom] = useState(personne?.surnom ?? "");
  const [sexe, setSexe] = useState<"M" | "F" | null>(personne?.sexe ?? null);
  const [vivant, setVivant] = useState(personne ? (personne.vivant ?? true) : true);
  const [dateNaissance, setDateNaissance] = useState(personne?.date_naissance ?? "");
  const [dateDeces, setDateDeces] = useState(personne?.date_deces ?? "");
  const [quartierId, setQuartierId] = useState(personne?.quartier_id ?? "");
  const [familleId, setFamilleId] = useState(personne?.famille_id ?? "");
  const [modeNouveauQuartier, setModeNouveauQuartier] = useState(false);
  const [nouveauQuartier, setNouveauQuartier] = useState("");
  const [modeNouvelleFamille, setModeNouvelleFamille] = useState(false);
  const [nouvelleFamille, setNouvelleFamille] = useState("");
  const [source, setSource] = useState(personne?.source ?? "Témoignage du CHO");
  const [fiabilite, setFiabilite] = useState(personne?.fiabilite ?? "confirmé");
  const [provisoireParents, setProvisoireParents] = useState(false);
  const [pereId, setPereId] = useState<string | null>(personne?.pere?.id ?? null);
  const [mereId, setMereId] = useState<string | null>(personne?.mere?.id ?? null);
  const [conjointId, setConjointId] = useState<string | null>(
    personne?.conjoint?.id ?? null
  );
  const [enfants, setEnfants] = useState<(ResultatPersonne | null)[]>(
    personne?.enfants?.length ? [...personne.enfants] : []
  );

  const ajouterEnfant = () => setEnfants((liste) => [...liste, null]);

  const retirerEnfant = (index: number) =>
    setEnfants((liste) => liste.filter((_, i) => i !== index));

  const choisirEnfant =
    (index: number) => (p: ResultatPersonne | null) =>
      setEnfants((liste) => liste.map((e, i) => (i === index ? p : e)));

  const famillesFiltrees = useMemo(() => {
    if (!quartierId) return options.familles;
    return options.familles.filter((f) => f.quartier_id === quartierId);
  }, [options.familles, quartierId]);

  const soumettre = () => {
    if (!nom.trim()) {
      toast.error("Le nom est obligatoire.");
      return;
    }
    const donnees = {
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
      nouveau_quartier: modeNouveauQuartier ? nouveauQuartier : "",
      nouvelle_famille: modeNouvelleFamille ? nouvelleFamille : "",
      enfants_ids: enfants
        .filter((e): e is ResultatPersonne => e !== null)
        .map((e) => e.id),
    };
    startTransition(async () => {
      const res = edition && personne
        ? await modifier(personne.id, donnees)
        : await declarer({ ...donnees, provisoireParents });
      if (res.erreur) {
        toast.error(res.erreur);
        return;
      }
      if (res.id) {
        toast.success(
          edition ? "Modifications enregistrées." : "Personne enregistrée dans le tableau."
        );
        router.push(`/tableau/personnes/${res.id}`);
        router.refresh();
      }
    });
  };

  const reinit = () => {
    setNom(personne?.nom ?? "");
    setPrenom(personne?.prenom ?? "");
    setSurnom(personne?.surnom ?? "");
    setSexe(personne?.sexe ?? null);
    setVivant(personne ? (personne.vivant ?? true) : true);
    setDateNaissance(personne?.date_naissance ?? "");
    setDateDeces(personne?.date_deces ?? "");
    setQuartierId(personne?.quartier_id ?? "");
    setFamilleId(personne?.famille_id ?? "");
    setModeNouveauQuartier(false);
    setNouveauQuartier("");
    setModeNouvelleFamille(false);
    setNouvelleFamille("");
    setSource(personne?.source ?? "Témoignage du CHO");
    setFiabilite(personne?.fiabilite ?? "confirmé");
    setProvisoireParents(false);
    setPereId(personne?.pere?.id ?? null);
    setMereId(personne?.mere?.id ?? null);
    setConjointId(personne?.conjoint?.id ?? null);
    setEnfants(personne?.enfants?.length ? [...personne.enfants] : []);
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
      {modeNouveauQuartier ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={nouveauQuartier}
            onChange={(e) => setNouveauQuartier(e.target.value)}
            placeholder="Nom du nouveau quartier…"
            className="flex-1 rounded-lg border px-3 py-2 text-base"
          />
          <button
            type="button"
            onClick={() => {
              setModeNouveauQuartier(false);
              setNouveauQuartier("");
            }}
            className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-current/5"
          >
            Annuler
          </button>
        </div>
      ) : (
        <select
          value={quartierId}
          onChange={(e) => {
            if (e.target.value === "__nouveau__") {
              setModeNouveauQuartier(true);
              setQuartierId("");
              setFamilleId("");
              return;
            }
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
          <option value="__nouveau__">＋ Ajouter un quartier…</option>
        </select>
      )}
    </label>
  );

  const selectFamilles = (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">Famille</span>
      {modeNouvelleFamille ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={nouvelleFamille}
            onChange={(e) => setNouvelleFamille(e.target.value)}
            placeholder="Nom de la nouvelle famille…"
            className="flex-1 rounded-lg border px-3 py-2 text-base"
          />
          <button
            type="button"
            onClick={() => {
              setModeNouvelleFamille(false);
              setNouvelleFamille("");
            }}
            className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-current/5"
          >
            Annuler
          </button>
        </div>
      ) : (
        <select
          value={familleId}
          onChange={(e) => {
            if (e.target.value === "__nouveau__") {
              setModeNouvelleFamille(true);
              setFamilleId("");
              return;
            }
            setFamilleId(e.target.value);
          }}
          className="rounded-lg border px-3 py-2 text-base"
        >
          <option value="">— Aucune famille —</option>
          {famillesFiltrees.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom}
            </option>
          ))}
          <option value="__nouveau__">＋ Ajouter une famille…</option>
        </select>
      )}
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
      <fieldset className="rounded-2xl border border-amber-700/30 bg-amber-50/70 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-amber-800">
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

      <fieldset className="rounded-2xl border border-amber-700/30 bg-amber-50/70 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-amber-800">
          2 · Dates (texte libre)
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {champ("Naissance (ex. « vers 1890 »)", dateNaissance, setDateNaissance)}
          {!vivant && champ("Décès", dateDeces, setDateDeces)}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-amber-700/30 bg-amber-50/70 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-amber-800">
          3 · Lieu
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {selectQuartiers}
          {selectFamilles}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-amber-700/30 bg-amber-50/70 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-amber-800">
          4 · Liens
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <RecherchePersonne
            label="Père"
            valeurInitiale={personne?.pere ?? null}
            onChange={(p) => setPereId(p ? p.id : null)}
          />
          <RecherchePersonne
            label="Mère"
            valeurInitiale={personne?.mere ?? null}
            onChange={(p) => setMereId(p ? p.id : null)}
          />
          <RecherchePersonne
            label="Conjoint(e)"
            valeurInitiale={personne?.conjoint ?? null}
            onChange={(p) => setConjointId(p ? p.id : null)}
          />
        </div>
        {!edition && (
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={provisoireParents}
              onChange={(e) => setProvisoireParents(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Je n&apos;ai pas encore la personne → créer des{" "}
              <em>cartes provisoires</em> « Père/Mère inconnu » (complétées plus
              tard).
            </span>
          </label>
        )}

        <div className="mt-5 border-t border-amber-700/20 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">
              Enfants de cette personne
            </span>
            <button
              type="button"
              onClick={ajouterEnfant}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-700/40 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-700/10"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Ajouter un enfant
            </button>
          </div>
          {enfants.length === 0 ? (
            <p className="mt-2 text-xs opacity-60">
              Aucun enfant relié pour l&apos;instant.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {enfants.map((enfant, index) => (
                <div key={index} className="relative">
                  <RecherchePersonne
                    label={`Enfant n° ${index + 1}`}
                    valeurInitiale={enfant ?? null}
                    onChange={choisirEnfant(index)}
                  />
                  <button
                    type="button"
                    onClick={() => retirerEnfant(index)}
                    className="absolute -right-2 -top-2 z-10 rounded-full bg-rose-600 p-1 text-white shadow transition hover:bg-rose-700"
                    aria-label={`Retirer l'enfant n° ${index + 1}`}
                    title="Retirer"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-amber-700/30 bg-amber-50/70 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-amber-800">
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
          {edition ? "Enregistrer les modifications" : "Ajouter la personne"}
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