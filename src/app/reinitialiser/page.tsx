"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/branding/logo";

export default function ReinitialiserPage() {
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [expire, setExpire] = useState(false);
  const [pending, startTransition] = useTransition();
  const [mdp, setMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [voirMdp, setVoirMdp] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: abonnement } = supabase.auth.onAuthStateChange(
      (_evenement, session) => {
        if (session) setPret(true);
      }
    );
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPret(true);
    });
    const minuteur = setTimeout(() => {
      if (!pret) setExpire(true);
    }, 6000);
    return () => {
      clearTimeout(minuteur);
      abonnement.subscription.unsubscribe();
    };
  }, [pret]);

  const enregistrer = () => {
    if (mdp.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (mdp !== confirmation) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: mdp });
      if (error) {
        toast.error(`Changement impossible : ${error.message}`);
        return;
      }
      toast.success("Mot de passe mis à jour. Reconnectez-vous.");
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-current/10 bg-current/0 p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <div>
            <h1 className="text-xl font-bold">Nouveau mot de passe</h1>
            <p className="text-sm opacity-70">
              Choisissez un nouveau mot de passe pour votre compte.
            </p>
          </div>
        </div>

        {!pret && !expire && (
          <p className="text-center text-sm opacity-70">
            Vérification du lien…
          </p>
        )}

        {expire && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-red-700">
              Ce lien est invalide ou a expiré. Demandez un nouveau lien via «
              Mot de passe oublié ? » sur la page de connexion.
            </p>
            <a
              href="/login"
              className="rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-800"
            >
              Aller à la connexion
            </a>
          </div>
        )}

        {pret && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enregistrer();
            }}
            className="flex flex-col gap-4"
          >
            <label className="flex flex-col gap-1 text-sm font-medium">
              Nouveau mot de passe (8 caractères minimum)
              <span className="relative">
                <input
                  type={voirMdp ? "text" : "password"}
                  autoComplete="new-password"
                  value={mdp}
                  onChange={(e) => setMdp(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-lg border px-3 py-2 pr-10 text-base"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setVoirMdp((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 transition hover:bg-current/10"
                  aria-label={voirMdp ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  title={voirMdp ? "Masquer" : "Afficher"}
                >
                  {voirMdp ? (
                    <EyeOff className="h-4 w-4 opacity-70" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4 opacity-70" aria-hidden />
                  )}
                </button>
              </span>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Confirmer le mot de passe
              <input
                type={voirMdp ? "text" : "password"}
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                required
                minLength={8}
                className="rounded-lg border px-3 py-2 text-base"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-800 disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <KeyRound className="h-4 w-4" aria-hidden />
              )}
              Enregistrer le mot de passe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
