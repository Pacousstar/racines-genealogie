import type { Metadata } from "next";
import { LogOut, Users, MapPin, Network, HeartHandshake } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Personne, LienEnfant, Union } from "@/lib/arbre";
import GrandTableau from "@/components/arbre/grand-tableau";
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
      supabase.from("unions").select("conjoint_1,conjoint_2,date_union"),
      supabase.from("quartiers").select("id,nom").order("ordre"),
      supabase.from("familles").select("id"),
    ]);

  const role = (profil?.role ?? "lecteur") as string;
  const personnes = (personnesRes.data ?? []) as unknown as Personne[];
  const liens = (liensRes.data ?? []) as unknown as LienEnfant[];
  const unions = (unionsRes.data ?? []) as unknown as Union[];
  const quartiers = quartiersRes.data ?? [];

  const stats = [
    { label: "Personnes", value: personnes.length, Icon: Users },
    { label: "Quartiers", value: quartiers.length, Icon: MapPin },
    { label: "Familles", value: famillesRes.data?.length ?? 0, Icon: Network },
    { label: "Unions", value: unions.length, Icon: HeartHandshake },
  ];

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-4 border-b border-current/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight sm:text-xl">
            Le Grand Tableau
          </h1>
          <p className="truncate text-xs opacity-70 sm:text-sm">
            {user?.email} ·{" "}
            <span className="font-medium">{ROLE_LABEL[role] ?? role}</span>
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs">
          {stats.map(({ label, value, Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-current/15 px-3 py-1"
              title={label}
            >
              <Icon className="h-3.5 w-3.5 text-amber-700" aria-hidden />
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
        <GrandTableau
          personnes={personnes}
          liens={liens}
          unions={unions}
          quartiers={quartiers}
        />
      </main>
    </div>
  );
}