"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, RotateCcw, Loader2, X, Camera, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { declarer } from "@/app/tableau/declarer/actions";
import { modifier, mettrePhoto } from "@/app/tableau/personnes/actions";
import type { PersonneNouvelle } from "@/lib/types-declaration";
import RecherchePersonne, {
  type ResultatPersonne,
} from "@/components/saisie/recherche-personne";
import { initiales } from "@/lib/arbre";

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
  photo_url: string | null;
  source: string | null;
  fiabilite: string | null;
  retraite: boolean;
  residence: string | null;
  crise_2010_2011: boolean;
  est_ancetre: boolean | null;
  pere: ResultatPersonne | null;
  mere: ResultatPersonne | null;
  conjoints: ResultatPersonne[];
  enfants: ResultatPersonne[];
};

const SOURCES = ["Témoignage du CHO", "Registre", "Document", "Autre"];
const FIABILITES = ["confirmé", "probable", "en cours"];

const styleEncart =
  "rounded-2xl border-2 border-emerald-600 bg-white p-5 text-blue-900";
const styleLegende =
  "px-2 text-sm font-bold uppercase tracking-wide text-emerald-600";
const styleCase = "h-4 w-4 accent-emerald-600";

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

type DetailLien = { decede: boolean; dateDeces: string };
type ModeLien = "relier" | "declarer";
type EnfantLigne = {
  personne: ResultatPersonne | null;
  mode: ModeLien;
  nouvelle: PersonneNouvelle | null;
  naissance: string;
  decede: boolean;
  deces: string;
  autreParent: ResultatPersonne | null;
  autreMode: ModeLien;
  autreNouvelle: PersonneNouvelle | null;
};
type ConjointLigne = {
  personne: ResultatPersonne | null;
  mode: ModeLien;
  nouvelle: PersonneNouvelle | null;
  detail: DetailLien;
};

const nouvelleVide = (): PersonneNouvelle => ({
  nom: "",
  prenom: "",
  sexe: null,
  date_naissance: "",
  date_deces: "",
  decede: false,
});

const detailDe = (p: ResultatPersonne | null): DetailLien => ({
  decede: Boolean(p && p.vivant === false),
  dateDeces: p?.date_deces ?? "",
});

const ligneDe = (p: ResultatPersonne | null): EnfantLigne => ({
  personne: p,
  mode: "relier",
  nouvelle: null,
  naissance: p?.date_naissance ?? "",
  decede: Boolean(p && p.vivant === false),
  deces: p?.date_deces ?? "",
  autreParent: null,
  autreMode: "relier",
  autreNouvelle: null,
});

const nouvelleDepuis = (p: ResultatPersonne): PersonneNouvelle => ({
  nom: p.nom,
  prenom: p.prenom ?? "",
  sexe: p.sexe === "M" || p.sexe === "F" ? p.sexe : null,
  date_naissance: p.date_naissance ?? "",
  date_deces: p.date_deces ?? "",
  decede: p.vivant === false,
});

const ligneNouvelle = (): EnfantLigne => ({
  personne: null,
  mode: "declarer",
  nouvelle: nouvelleVide(),
  naissance: "",
  decede: false,
  deces: "",
  autreParent: null,
  autreMode: "relier",
  autreNouvelle: null,
});

const ligneConjointDe = (p: ResultatPersonne): ConjointLigne => ({
  personne: p,
  mode: "relier",
  nouvelle: null,
  detail: detailDe(p),
});

const ligneConjointNouvelle = (): ConjointLigne => ({
  personne: null,
  mode: "declarer",
  nouvelle: nouvelleVide(),
  detail: { decede: false, dateDeces: "" },
});

function BoutonMode({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
        actif ? "bg-emerald-700 text-white" : "bg-current/10 hover:bg-current/20"
      }`}
    >
      {children}
    </button>
  );
}

function ChampNouveau({
  etat,
  setEtat,
  placeholderNom = "Nom",
}: {
  etat: PersonneNouvelle;
  setEtat: (n: PersonneNouvelle) => void;
  placeholderNom?: string;
}) {
  const maj = (patch: Partial<PersonneNouvelle>) =>
    setEtat({ ...etat, ...patch });
  return (
    <div className="rounded-xl border border-emerald-300 bg-white p-3 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Nom</span>
          <input
            type="text"
            value={etat.nom}
            onChange={(e) => maj({ nom: e.target.value })}
            placeholder={placeholderNom}
            className="rounded-lg border border-emerald-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Prénom</span>
          <input
            type="text"
            value={etat.prenom}
            onChange={(e) => maj({ prenom: e.target.value })}
            className="rounded-lg border border-emerald-200 px-3 py-2"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sexe :</span>
          <Radio checked={etat.sexe === "M"} onChange={() => maj({ sexe: "M" })} label="♂ Homme" />
          <Radio checked={etat.sexe === "F"} onChange={() => maj({ sexe: "F" })} label="♀ Femme" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Vivant :</span>
          <Radio checked={!etat.decede} onChange={() => maj({ decede: false })} label="✓ Oui" />
          <Radio checked={etat.decede} onChange={() => maj({ decede: true })} label="Décédé" />
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Naissance</span>
          <input
            type="text"
            value={etat.date_naissance}
            onChange={(e) => maj({ date_naissance: e.target.value })}
            placeholder="Ex. « vers 1890 »"
            className="rounded-lg border border-emerald-200 px-3 py-2"
          />
        </label>
        {etat.decede && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Décès</span>
            <input
              type="text"
              value={etat.date_deces}
              onChange={(e) => maj({ date_deces: e.target.value })}
              placeholder="Ex. « 2011 »"
              className="rounded-lg border border-emerald-200 px-3 py-2"
            />
          </label>
        )}
      </div>
    </div>
  );
}

function GroupeLien({
  label,
  valeurInitiale,
  detail,
  onChangePersonne,
  onChangeDetail,
  surlignage,
}: {
  label: string;
  valeurInitiale: ResultatPersonne | null;
  detail: DetailLien;
  onChangePersonne: (p: ResultatPersonne | null) => void;
  onChangeDetail: (d: DetailLien) => void;
  surlignage?: string;
}) {
  return (
    <div className={`relative rounded-xl border p-2 ${surlignage ?? "border-current/10"}`}>
      <RecherchePersonne
        label={label}
        valeurInitiale={valeurInitiale}
        onChange={onChangePersonne}
      />
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={detail.decede}
          onChange={(e) => onChangeDetail({ ...detail, decede: e.target.checked })}
          className={styleCase}
        />
        <span className="font-medium">Décédé(e)</span>
      </label>
      {detail.decede && (
        <input
          type="text"
          value={detail.dateDeces}
          onChange={(e) => onChangeDetail({ ...detail, dateDeces: e.target.value })}
          placeholder="Date du décès (ex. « 2011 »)"
          className="mt-1 w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}

function GroupeLienOuNouveau({
  label,
  mode,
  setMode,
  valeurInitiale,
  detail,
  onChangePersonne,
  onChangeDetail,
  nouveau,
  setNouveau,
  cleForm,
}: {
  label: string;
  mode: ModeLien;
  setMode: (m: ModeLien) => void;
  valeurInitiale: ResultatPersonne | null;
  detail: DetailLien;
  onChangePersonne: (p: ResultatPersonne | null) => void;
  onChangeDetail: (d: DetailLien) => void;
  nouveau: PersonneNouvelle;
  setNouveau: (n: PersonneNouvelle) => void;
  cleForm: number;
}) {
  return (
    <div className="relative rounded-xl border border-current/10 p-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
          {label}
        </span>
        <div className="flex gap-1.5">
          <BoutonMode actif={mode === "relier"} onClick={() => setMode("relier")}>
            Chercher
          </BoutonMode>
          <BoutonMode actif={mode === "declarer"} onClick={() => setMode("declarer")}>
            Déclarer ici
          </BoutonMode>
        </div>
      </div>
      {mode === "relier" ? (
        <GroupeLien
          key={`${label}-${cleForm}`}
          label=""
          valeurInitiale={valeurInitiale}
          detail={detail}
          onChangePersonne={onChangePersonne}
          onChangeDetail={onChangeDetail}
        />
      ) : (
        <ChampNouveau etat={nouveau} setEtat={setNouveau} />
      )}
    </div>
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
  const [enregistrement, setEnregistrement] = useState(false);
  const edition = Boolean(personne);

  const [nom, setNom] = useState(personne?.nom ?? "");
  const [prenom, setPrenom] = useState(personne?.prenom ?? "");
  const [surnom, setSurnom] = useState(personne?.surnom ?? "");
  const [sexe, setSexe] = useState<"M" | "F" | null>(personne?.sexe ?? null);
  const [vivant, setVivant] = useState(personne ? (personne.vivant ?? true) : true);
  const [dateNaissance, setDateNaissance] = useState(personne?.date_naissance ?? "");
  const [dateDeces, setDateDeces] = useState(personne?.date_deces ?? "");
  const [retraite, setRetraite] = useState(personne?.retraite ?? false);
  const [residence, setResidence] = useState(personne?.residence ?? "");
  const [crise2010, setCrise2010] = useState(personne?.crise_2010_2011 ?? false);
  const [estAncetre, setEstAncetre] = useState(personne?.est_ancetre ?? false);
  const [quartierId, setQuartierId] = useState(personne?.quartier_id ?? "");
  const [familleId, setFamilleId] = useState(personne?.famille_id ?? "");
  const [modeNouveauQuartier, setModeNouveauQuartier] = useState(false);
  const [nouveauQuartier, setNouveauQuartier] = useState("");
  const [modeNouvelleFamille, setModeNouvelleFamille] = useState(false);
  const [nouvelleFamille, setNouvelleFamille] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    personne?.photo_url ?? null
  );
  const [photoEnvoi, setPhotoEnvoi] = useState(false);
  const [fichierEnAttente, setFichierEnAttente] = useState<File | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [source, setSource] = useState(personne?.source ?? "Témoignage du CHO");
  const [sourceDetail, setSourceDetail] = useState("");
  const [fiabilite, setFiabilite] = useState(personne?.fiabilite ?? "confirmé");
  const [provisoireParents, setProvisoireParents] = useState(false);
  const [pereId, setPereId] = useState<string | null>(personne?.pere?.id ?? null);
  const [mereId, setMereId] = useState<string | null>(personne?.mere?.id ?? null);
  const [conjoints, setConjoints] = useState<ConjointLigne[]>(
    (personne?.conjoints ?? []).map(ligneConjointDe)
  );
  const [pereDetail, setPereDetail] = useState<DetailLien>(
    detailDe(personne?.pere ?? null)
  );
  const [mereDetail, setMereDetail] = useState<DetailLien>(
    detailDe(personne?.mere ?? null)
  );
  const [enfants, setEnfants] = useState<EnfantLigne[]>(
    (personne?.enfants ?? []).map(ligneDe)
  );
  const [cleForm, setCleForm] = useState(0);
  const [pereMode, setPereMode] = useState<ModeLien>(
    personne?.pere ? "relier" : "declarer"
  );
  const [mereMode, setMereMode] = useState<ModeLien>(
    personne?.mere ? "relier" : "declarer"
  );
  const [nouveauPere, setNouveauPere] = useState<PersonneNouvelle>(nouvelleVide());
  const [nouvelleMere, setNouvelleMere] = useState<PersonneNouvelle>(nouvelleVide());

  const ajouterEnfant = () => setEnfants((liste) => [...liste, ligneNouvelle()]);

  const retirerEnfant = (index: number) =>
    setEnfants((liste) => liste.filter((_, i) => i !== index));

  const choisirEnfant =
    (index: number) => (p: ResultatPersonne | null) =>
      setEnfants((liste) =>
        liste.map((l, i) => (i === index ? ligneDe(p) : l))
      );

  const majEnfant = (index: number, patch: Partial<EnfantLigne>) =>
    setEnfants((liste) =>
      liste.map((l, i) => (i === index ? { ...l, ...patch } : l))
    );

  const ajouterConjoint = () =>
    setConjoints((liste) => [...liste, ligneConjointNouvelle()]);

  const retirerConjoint = (index: number) =>
    setConjoints((liste) => liste.filter((_, i) => i !== index));

  const majConjoint = (index: number, patch: Partial<ConjointLigne>) =>
    setConjoints((liste) =>
      liste.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );

  const sourceFinale = sourceDetail.trim()
    ? `${source} — ${sourceDetail.trim()}`
    : source;

  const photoSrc = photoUrl
    ? photoUrl.startsWith("data:") || photoUrl.startsWith("blob:")
      ? photoUrl
      : photoUrl.startsWith("http")
        ? photoUrl
        : `/photo?p=${encodeURIComponent(photoUrl)}`
    : null;

  const choixPhoto = async (fichier: File | undefined) => {
    if (!fichier) return;
    if (!edition || !personne) {
      setFichierEnAttente(fichier);
      setApercu(URL.createObjectURL(fichier));
      return;
    }
    setPhotoEnvoi(true);
    const supabase = createClient();
    const name = fichier.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const chemin = `public/${personne.id}/${Date.now()}-${name}`;
    const { error } = await supabase.storage
      .from("photos")
      .upload(chemin, fichier);
    setPhotoEnvoi(false);
    if (error) {
      toast.error(`Envoi de la photo impossible : ${error.message}`);
      return;
    }
    setPhotoUrl(chemin);
  };

  const retirerPhoto = () => {
    setPhotoUrl(null);
    setFichierEnAttente(null);
    setApercu(null);
  };

  const envoyerPhotoAttente = async (id: string) => {
    if (!fichierEnAttente) return;
    const supabase = createClient();
    const name = fichierEnAttente.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const chemin = `public/${id}/${Date.now()}-${name}`;
    const { error } = await supabase.storage
      .from("photos")
      .upload(chemin, fichierEnAttente);
    if (!error) await mettrePhoto(id, chemin);
  };

  const famillesFiltrees = useMemo(() => {
    if (!quartierId) return options.familles;
    return options.familles.filter((f) => f.quartier_id === quartierId);
  }, [options.familles, quartierId]);

  const soumettre = async () => {
    if (!nom.trim()) {
      toast.error("Le nom est obligatoire.");
      return;
    }
    setEnregistrement(true);
    try {
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
        source: sourceFinale,
        fiabilite,
        pere_id: pereMode === "relier" ? pereId : null,
        mere_id: mereMode === "relier" ? mereId : null,
        conjoints: conjoints
          .filter(
            (c) =>
              (c.mode === "relier" && c.personne) ||
              (c.mode === "declarer" && c.nouvelle?.nom?.trim())
          )
          .map((c) => ({
            id: c.mode === "relier" ? c.personne?.id ?? null : null,
            nouveau: c.mode === "declarer" ? c.nouvelle : null,
            detail: c.mode === "relier" ? (c.personne ? c.detail : null) : null,
          })),
        pere_nouveau: pereMode === "declarer" ? nouveauPere : null,
        mere_nouveau: mereMode === "declarer" ? nouvelleMere : null,
        photo_url: photoUrl || null,
        nouveau_quartier: modeNouveauQuartier ? nouveauQuartier : "",
        nouvelle_famille: modeNouvelleFamille ? nouvelleFamille : "",
        retraite,
        residence,
        crise_2010_2011: crise2010,
        est_ancetre: estAncetre,
        pere: pereId ? pereDetail : null,
        mere: mereId ? mereDetail : null,
        enfants: enfants.map((l) => ({
          id: l.mode === "relier" ? l.personne?.id ?? null : null,
          nouveau: l.mode === "declarer" ? l.nouvelle : null,
          date_naissance: l.naissance,
          decede: l.decede,
          date_deces: l.deces,
          autre_parent_id:
            l.autreMode === "relier" ? l.autreParent?.id ?? null : null,
          autre_parent_nouveau:
            l.autreMode === "declarer" ? l.autreNouvelle : null,
        })),
      };
      const res = edition && personne
        ? await modifier(personne.id, donnees)
        : await declarer({ ...donnees, provisoireParents });
      if (res.erreur) {
        toast.error(res.erreur);
        setEnregistrement(false);
        return;
      }
      toast.success(
        edition
          ? "Modifications enregistrées."
          : "Personne enregistrée dans le tableau."
      );
      if (res.id) {
        if (!edition) await envoyerPhotoAttente(res.id);
        router.push(`/tableau/personnes/${res.id}`);
        router.refresh();
        setTimeout(() => setEnregistrement(false), 2500);
      } else {
        setEnregistrement(false);
      }
    } catch (e) {
      toast.error(
        `Une erreur est survenue : ${e instanceof Error ? e.message : "inconnue"}`
      );
      setEnregistrement(false);
    }
  };

  const reinit = () => {
    setNom(personne?.nom ?? "");
    setPrenom(personne?.prenom ?? "");
    setSurnom(personne?.surnom ?? "");
    setSexe(personne?.sexe ?? null);
    setVivant(personne ? (personne.vivant ?? true) : true);
    setDateNaissance(personne?.date_naissance ?? "");
    setDateDeces(personne?.date_deces ?? "");
    setRetraite(personne?.retraite ?? false);
    setResidence(personne?.residence ?? "");
    setCrise2010(personne?.crise_2010_2011 ?? false);
    setEstAncetre(personne?.est_ancetre ?? false);
    setQuartierId(personne?.quartier_id ?? "");
    setFamilleId(personne?.famille_id ?? "");
    setModeNouveauQuartier(false);
    setNouveauQuartier("");
    setModeNouvelleFamille(false);
    setNouvelleFamille("");
    setPhotoUrl(personne?.photo_url ?? null);
    setPhotoEnvoi(false);
    setFichierEnAttente(null);
    setApercu(null);
    setSource(personne?.source ?? "Témoignage du CHO");
    setSourceDetail("");
    setFiabilite(personne?.fiabilite ?? "confirmé");
    setProvisoireParents(false);
    setPereId(personne?.pere?.id ?? null);
    setMereId(personne?.mere?.id ?? null);
    setConjoints((personne?.conjoints ?? []).map(ligneConjointDe));
    setPereDetail(detailDe(personne?.pere ?? null));
    setMereDetail(detailDe(personne?.mere ?? null));
    setEnfants((personne?.enfants ?? []).map(ligneDe));
    setCleForm((n) => n + 1);
    setPereMode(personne?.pere ? "relier" : "declarer");
    setMereMode(personne?.mere ? "relier" : "declarer");
    setNouveauPere(nouvelleVide());
    setNouvelleMere(nouvelleVide());
  };

  const champ = (label: string, value: string, set: (v: string) => void) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        className="rounded-lg border border-emerald-200 px-3 py-2 text-base"
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
            className="flex-1 rounded-lg border border-emerald-200 px-3 py-2 text-base"
          />
          <button
            type="button"
            onClick={() => {
              setModeNouveauQuartier(false);
              setNouveauQuartier("");
            }}
            className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium transition hover:bg-current/5"
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
          className="rounded-lg border border-emerald-200 px-3 py-2 text-base"
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
            className="flex-1 rounded-lg border border-emerald-200 px-3 py-2 text-base"
          />
          <button
            type="button"
            onClick={() => {
              setModeNouvelleFamille(false);
              setNouvelleFamille("");
            }}
            className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium transition hover:bg-current/5"
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
          className="rounded-lg border border-emerald-200 px-3 py-2 text-base"
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
        void soumettre();
      }}
      className="flex flex-col gap-5"
    >
      <fieldset className={styleEncart}>
        <legend className={styleLegende}>1 · Qui ?</legend>
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={retraite}
              onChange={(e) => setRetraite(e.target.checked)}
              className={styleCase}
            />
            <span className="font-medium">Retraité(e)</span>
          </label>
          {champ("Résidence (quartier habité)", residence, setResidence)}
        </div>
        <label
          className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-emerald-600 bg-white px-4 py-3 shadow-sm transition hover:bg-emerald-50"
          title="Cochez pour le/la fondateur(trice) du village : il/elle sera au sommet de l'arbre (badge ★ Ancêtre) et rien ne s'affichera au-dessus."
        >
          <input
            type="checkbox"
            checked={estAncetre}
            onChange={(e) => setEstAncetre(e.target.checked)}
            className="h-5 w-5 accent-emerald-600"
          />
          <Star
            className={`h-5 w-5 shrink-0 ${estAncetre ? "text-emerald-700" : "text-emerald-300"}`}
            aria-hidden
          />
          <span className="text-sm font-semibold text-emerald-800">
            Ancêtre fondateur — au sommet de l&apos;arbre (★)
          </span>
        </label>

        <div className="mt-5 border-t border-emerald-200 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold uppercase tracking-wide text-blue-900">
              Conjoint(e)s
            </span>
            <button
              type="button"
              onClick={ajouterConjoint}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-blue-800 transition hover:bg-emerald-100"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Ajouter un(e) conjoint(e)
            </button>
          </div>
          <p className="mt-1 text-xs opacity-60">
            Un conjoint est une personne à part entière, créée et reliée. Il peut
            y en avoir plusieurs : le <strong>1ᵉʳ déclaré est le conjoint
            principal</strong> (affiché en couple dans l&apos;arbre), les autres
            apparaissent en blocs secondaires avec leurs propres enfants.
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {conjoints.length === 0 ? (
              <p className="text-xs opacity-60">
                Aucun(e) conjoint(e) déclaré(e) pour l&apos;instant.
              </p>
            ) : (
              conjoints.map((c, index) => (
                <div
                  key={index}
                  className="relative rounded-xl border border-emerald-300 bg-white p-3 shadow-sm"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      Conjoint(e) n° {conjoints.length === 1 ? "1 (principal)" : index + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {index === 0 && conjoints.length > 1 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Principal
                        </span>
                      )}
                      <BoutonMode
                        actif={c.mode === "relier"}
                        onClick={() => majConjoint(index, { mode: "relier" })}
                      >
                        Chercher
                      </BoutonMode>
                      <BoutonMode
                        actif={c.mode === "declarer"}
                        onClick={() => majConjoint(index, { mode: "declarer" })}
                      >
                        Déclarer ici
                      </BoutonMode>
                    </div>
                  </div>
                  {c.mode === "relier" ? (
                    <GroupeLien
                      key={`conjoint-${index}-${cleForm}`}
                      label="Rechercher le/la conjoint(e)…"
                      valeurInitiale={c.personne}
                      detail={c.detail}
                      onChangePersonne={(p) =>
                        majConjoint(index, { personne: p, detail: detailDe(p) })
                      }
                      onChangeDetail={(d) => majConjoint(index, { detail: d })}
                    />
                  ) : (
                    <ChampNouveau
                      etat={c.nouvelle ?? nouvelleVide()}
                      setEtat={(n) => majConjoint(index, { nouvelle: n })}
                      placeholderNom="Nom du/de la conjoint(e)"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => retirerConjoint(index)}
                    className="absolute -right-2 -top-2 rounded-full bg-rose-600 p-1 text-white shadow transition hover:bg-rose-700"
                    aria-label={`Retirer le/la conjoint(e) n° ${index + 1}`}
                    title="Retirer"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-emerald-200 pt-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-800 text-2xl font-bold text-white">
              {photoSrc || apercu ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    apercu ??
                    photoSrc ??
                    (personne
                      ? `/photo?p=${encodeURIComponent(personne.photo_url ?? "")}`
                      : "")
                  }
                  alt="Photo de la personne"
                  className="h-full w-full object-cover"
                />
              ) : (
                initiales(
                  personne ?? {
                    nom: nom.trim() || "?",
                    prenom: null,
                    sexe: null,
                    date_naissance: null,
                    date_deces: null,
                    vivant: null,
                  }
                )
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium">Photo</span>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-blue-800 transition hover:bg-emerald-100">
                  {photoEnvoi ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Camera className="h-4 w-4" aria-hidden />
                  )}
                  {photoEnvoi
                    ? "Envoi en cours…"
                    : photoUrl || apercu
                      ? "Changer la photo"
                      : "Choisir une photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => choixPhoto(e.target.files?.[0])}
                  />
                </label>
                {(photoUrl || apercu) && (
                  <button
                    type="button"
                    onClick={retirerPhoto}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-600/40 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-600/10"
                  >
                    <X className="h-4 w-4" aria-hidden /> Retirer la photo
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs opacity-60">
                JPG, PNG ou WebP — 5 Mo maximum. Nouvelle personne : la photo
                est chargée à l&apos;enregistrement.
              </p>
            </div>
          </div>
      </fieldset>

      <fieldset className={styleEncart}>
        <legend className={styleLegende}>2 · Dates (texte libre)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {champ("Naissance (ex. « vers 1890 »)", dateNaissance, setDateNaissance)}
          {champ("Décès", dateDeces, setDateDeces)}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={crise2010}
            onChange={(e) => setCrise2010(e.target.checked)}
            className={styleCase}
          />
          <span className="font-medium">
            Décès durant la crise 2010-2011
          </span>
        </label>
      </fieldset>

      <fieldset className={styleEncart}>
        <legend className={styleLegende}>3 · Lieu</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {selectQuartiers}
          {selectFamilles}
        </div>
        <p className="mt-3 text-xs opacity-60">
          Les personnes reliées (parents, enfants) peuvent appartenir à
          n&apos;importe quel quartier ou famille du village — la recherche les
          trouvera partout.
        </p>
      </fieldset>

      <fieldset className={styleEncart}>
        <legend className={styleLegende}>4 · Liens</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <GroupeLienOuNouveau
            label="Père"
            mode={pereMode}
            setMode={setPereMode}
            valeurInitiale={personne?.pere ?? null}
            detail={pereDetail}
            onChangePersonne={(p) => {
              setPereId(p ? p.id : null);
              setPereDetail(detailDe(p));
            }}
            onChangeDetail={setPereDetail}
            nouveau={nouveauPere}
            setNouveau={setNouveauPere}
            cleForm={cleForm}
          />
          <GroupeLienOuNouveau
            label="Mère"
            mode={mereMode}
            setMode={setMereMode}
            valeurInitiale={personne?.mere ?? null}
            detail={mereDetail}
            onChangePersonne={(p) => {
              setMereId(p ? p.id : null);
              setMereDetail(detailDe(p));
            }}
            onChangeDetail={setMereDetail}
            nouveau={nouvelleMere}
            setNouveau={setNouvelleMere}
            cleForm={cleForm}
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

        <div className="mt-5 border-t border-emerald-200 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">
              Enfants de cette personne
            </span>
            <button
              type="button"
              onClick={ajouterEnfant}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-blue-800 transition hover:bg-emerald-100"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Ajouter un enfant
            </button>
          </div>
          {enfants.length === 0 ? (
            <p className="mt-2 text-xs opacity-60">
              Aucun enfant relié pour l&apos;instant.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {enfants.map((enfant, index) => (
                <div
                  key={index}
                  className="relative rounded-xl border border-emerald-300 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                          Enfant n° {index + 1}
                        </span>
                        <div className="flex gap-1.5">
                          <BoutonMode
                            actif={enfant.mode === "relier"}
                            onClick={() =>
                              majEnfant(index, {
                                mode: "relier",
                                naissance:
                                  enfant.nouvelle?.date_naissance ?? enfant.naissance,
                                decede: enfant.nouvelle?.decede ?? enfant.decede,
                                deces: enfant.nouvelle?.date_deces ?? enfant.deces,
                              })
                            }
                          >
                            Chercher
                          </BoutonMode>
                          <BoutonMode
                            actif={enfant.mode === "declarer"}
                            onClick={() =>
                              majEnfant(index, {
                                mode: "declarer",
                                nouvelle:
                                  enfant.personne
                                    ? nouvelleDepuis(enfant.personne)
                                    : enfant.nouvelle ?? nouvelleVide(),
                              })
                            }
                          >
                            Déclarer
                          </BoutonMode>
                        </div>
                      </div>
                      {enfant.mode === "relier" ? (
                        <RecherchePersonne
                          key={`enfant-${index}-${cleForm}`}
                          label=""
                          valeurInitiale={enfant.personne ?? null}
                          onChange={choisirEnfant(index)}
                        />
                      ) : (
                        <ChampNouveau
                          etat={enfant.nouvelle ?? nouvelleVide()}
                          setEtat={(n) => majEnfant(index, { nouvelle: n })}
                          placeholderNom={`Nom de l'enfant`}
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => retirerEnfant(index)}
                      className="rounded bg-rose-600 p-1 text-white shadow transition hover:bg-rose-700"
                      aria-label={`Retirer l'enfant n° ${index + 1}`}
                      title="Retirer"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                  {enfant.mode === "relier" && (
                    <div className="mt-2 grid gap-2">
                      <input
                        type="text"
                        value={enfant.naissance}
                        onChange={(e) => majEnfant(index, { naissance: e.target.value })}
                        placeholder="Date de naissance de l'enfant (ex. « vers 1980 »)"
                        className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={enfant.decede}
                          onChange={(e) => majEnfant(index, { decede: e.target.checked })}
                          className={styleCase}
                        />
                        <span className="font-medium">Décédé(e)</span>
                      </label>
                      {enfant.decede && (
                        <input
                          type="text"
                          value={enfant.deces}
                          onChange={(e) => majEnfant(index, { deces: e.target.value })}
                          placeholder="Date du décès (ex. « 2011 »)"
                          className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm"
                        />
                      )}
                    </div>
                  )}
                  <div className="mt-3 border-t border-emerald-200 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                        {sexe === "M"
                          ? "Mère de cet enfant"
                          : sexe === "F"
                            ? "Père de cet enfant"
                            : "Autre parent de cet enfant"}
                      </span>
                      <div className="flex gap-1.5">
                        <BoutonMode
                          actif={enfant.autreMode === "relier"}
                          onClick={() =>
                            majEnfant(index, { autreMode: "relier" })
                          }
                        >
                          Chercher
                        </BoutonMode>
                        <BoutonMode
                          actif={enfant.autreMode === "declarer"}
                          onClick={() =>
                            majEnfant(index, {
                              autreMode: "declarer",
                              autreNouvelle: enfant.autreParent
                                ? nouvelleDepuis(enfant.autreParent)
                                : enfant.autreNouvelle ?? nouvelleVide(),
                            })
                          }
                        >
                          Déclarer ici
                        </BoutonMode>
                      </div>
                    </div>
                    <p className="mt-1 text-xs opacity-60">
                      Cet enfant est aussi relié(e) à ce parent (obligatoire pour
                      savoir de qui il/elle est l&apos;enfant).
                    </p>
                    {enfant.autreMode === "relier" ? (
                      <div className="mt-1">
                        <RecherchePersonne
                          key={`autre-${index}-${cleForm}`}
                          label=""
                          valeurInitiale={enfant.autreParent ?? null}
                          onChange={(p) => majEnfant(index, { autreParent: p })}
                        />
                      </div>
                    ) : (
                      <div className="mt-1">
                        <ChampNouveau
                          etat={enfant.autreNouvelle ?? nouvelleVide()}
                          setEtat={(n) => majEnfant(index, { autreNouvelle: n })}
                          placeholderNom={`Nom ${sexe === "F" ? "du père" : "de la mère"}`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className={styleEncart}>
        <legend className={styleLegende}>5 · Source & fiabilité</legend>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Source :</span>
          {SOURCES.map((s) => (
            <Radio key={s} checked={source === s} onChange={() => setSource(s)} label={s} />
          ))}
        </div>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          <span className="font-medium">
            Préciser la source (n° registre, folio, document, témoin…)
          </span>
          <input
            type="text"
            value={sourceDetail}
            onChange={(e) => setSourceDetail(e.target.value)}
            placeholder="Ex. « registre des naissances, folio 12 »"
            className="rounded-lg border border-emerald-200 px-3 py-2 text-base"
          />
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <span className="font-medium">Fiabilité :</span>
          <select
            value={fiabilite}
            onChange={(e) => setFiabilite(e.target.value)}
            className="rounded-lg border border-emerald-200 px-3 py-2 text-base"
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
          disabled={enregistrement}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-base font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {enregistrement ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-5 w-5" aria-hidden />
          )}
          {edition ? "Enregistrer les modifications" : "Ajouter la personne"}
        </button>
        <button
          type="button"
          onClick={reinit}
          disabled={enregistrement}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-5 py-3 font-medium transition hover:bg-current/5 disabled:opacity-60"
        >
          <RotateCcw className="h-5 w-5" aria-hidden />
          Réinitialiser
        </button>
      </div>
    </form>
  );
}