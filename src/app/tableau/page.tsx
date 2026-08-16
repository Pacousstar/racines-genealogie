import type { Metadata } from "next";
import { LogOut, Users, MapPin, Network, HeartHandshake, FilePenLine, Map, LifeBuoy, Download, MapPinned } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Personne, LienEnfant, Union } from "@/lib/arbre";
import Explorateur from "@/components/arbre/explorateur";
import Logo from "@/components/branding/logo";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Le Grand Tableau" };
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur",
  editeur: "Éditeur (CHO)",
  lecteur: "Membre · lecture seule",
};

const CHAMPS_PERSONNE = [
  "id",
  "nom",
  "prenom",
  "surnom",
  "sexe",
  "date_naissance",
  "date_deces",
  "vivant",
  "quartier_id",
  "famille_id",
  "photo_url",
  "est_ancetre",
  "est_fondateur",
  "fiabilite",
  "source",
  "notes",
] as const;

export default async function TableauPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profil }, personnesRes, liensRes, unionsRes, quartiersRes, famillesRes] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user!.id).single(),
      supabase
        .from("personnes")
        .select(CHAMPS_PERSONNE.join(","))
        .order("nom"),
      supabase.from("enfants").select("parent_id,enfant_id,rang"),
      (async () => {
        const essai = await supabase
          .from("unions")
          .select("conjoint_1,conjoint_2,date_union,rang")
          .order("rang", { ascending: true, nullsFirst: false });
        if (!essai.error) return essai;
        if (/column .* does not exist|could not find/i.test(essai.error.message)) {
          return supabase.from("unions").select("conjoint_1,conjoint_2,date_union");
        }
        return essai;
      })(),
      supabase.from("quartiers").select("id,nom").order("ordre"),
      supabase.from("familles").select("id,nom,quartier_id").order("nom"),
    ]);

  const role = (profil?.role ?? "lecteur") as string;
  const estEditeur = role === "editeur" || role === "admin";
  const personnes = (personnesRes.data ?? []) as unknown as Personne[];
  const liens = (liensRes.data ?? []) as unknown as LienEnfant[];
  const unions = (unionsRes.data ?? []) as unknown as Union[];
  const quartiers = quartiersRes.data ?? [];
  const familles = famillesRes.data ?? [];

  const stats = [
    { label: "Personnes", value: personnes.length, Icon: Users },
    { label: "Quartiers", value: quartiers.length, Icon: MapPin },
    { label: "Familles", value: familles.length, Icon: Network },
    { label: "Unions", value: unions.length, Icon: HeartHandshake },
  ];

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-4 border-b border-white/15 px-4 py-3 text-white sm:px-6">
        <Logo />
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight sm:text-xl">
            Le Grand Tableau
          </h1>
          <p className="truncate text-xs text-white/75 sm:text-sm">
            {user?.email} ·{" "}
            <span className="font-medium">{ROLE_LABEL[role] ?? role}</span>
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs">
          {estEditeur && (
            <a
              href="/tableau/declarer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white transition hover:bg-emerald-800"
            >
              <FilePenLine className="h-4 w-4" aria-hidden />
              Déclarer
            </a>
          )}
          <a
            href="/tableau/carte"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-700/50 bg-amber-50 px-3 py-1.5 font-semibold text-amber-800 transition hover:bg-amber-100"
            title="Carte du village"
          >
            <Map className="h-4 w-4" aria-hidden />
            Carte
          </a>
          <a
            href="/tableau/quartiers"
            className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-3 py-1.5 font-medium transition hover:bg-current/10"
            title="Modifier les quartiers du village"
          >
            <MapPinned className="h-4 w-4" aria-hidden />
            Quartiers
          </a>
          <a
            href="/tableau/aides"
            className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-3 py-1.5 font-medium transition hover:bg-current/10"
            title="Aides à la reconstitution"
          >
            <LifeBuoy className="h-4 w-4" aria-hidden />
            Aides
          </a>
          <a
            href="/tableau/exporter"
            className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-3 py-1.5 font-medium transition hover:bg-current/10"
            title="Exporter la généalogie (GEDCOM, PDF)"
          >
            <Download className="h-4 w-4" aria-hidden />
            Exporter
          </a>
          {stats.map(({ label, value, Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-current/15 px-3 py-1"
              title={label}
            >
              <Icon className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
              <span className="font-semibold">{value}</span>
              <span className="hidden opacity-70 sm:inline">{label}</span>
            </span>
          ))}
          <form action={logout} className="ml-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-3 py-1.5 font-medium transition hover:bg-current/10"
              title="Se déconnecter"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Se déconnecter</span>
            </button>
          </form>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col p-4">
        <Explorateur
          personnes={personnes}
          liens={liens}
          unions={unions}
          quartiers={quartiers}
          familles={familles}
        />
      </main>
    </div>
  );
}