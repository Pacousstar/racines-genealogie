"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { login, envoyerLienReset, type LoginState, type ResetState } from "./actions";
import Logo from "@/components/branding/logo";

const initialState: LoginState = undefined;
const initialStateReset: ResetState = undefined;

export default function LoginForm({ erreur }: { erreur?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [resetState, resetAction, resetPending] = useActionState(
    envoyerLienReset,
    initialStateReset
  );
  const [modeReset, setModeReset] = useState(false);
  const [voirMdp, setVoirMdp] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border-2 border-emerald-600 bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <div>
            <h1 className="text-xl font-bold text-orange-700">Généalogie Toa-Zéo</h1>
            <p className="text-sm font-medium text-emerald-700">
              {modeReset
                ? "Réinitialiser le mot de passe"
                : "L’arbre du village — espace réservé aux membres."}
            </p>
          </div>
        </div>

        {modeReset ? (
          <form action={resetAction} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Email du compte
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                defaultValue=""
                className="rounded-lg border border-orange-500 px-3 py-2 text-base text-orange-700 placeholder:text-orange-400"
                placeholder="vous@exemple.fr"
              />
            </label>

            {resetState?.erreur && (
              <p
                role="alert"
                className="rounded-lg bg-red-600/15 px-3 py-2 text-sm text-red-700"
              >
                {resetState.erreur}
              </p>
            )}
            {resetState?.ok && (
              <p
                role="status"
                className="rounded-lg bg-emerald-700/15 px-3 py-2 text-sm text-emerald-800"
              >
                Si un compte correspond à cet e-mail, un lien de
                réinitialisation vient d&apos;être envoyé. Regardez votre
                boîte de réception.
              </p>
            )}

            <button
              type="submit"
              disabled={resetPending}
              className="mt-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {resetPending ? "Envoi…" : "Envoyer le lien"}
            </button>
            <button
              type="button"
              onClick={() => setModeReset(false)}
              className="inline-flex items-center justify-center gap-1.5 text-sm font-medium opacity-70 transition hover:opacity-100"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Retour à la
              connexion
            </button>
          </form>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                className="rounded-lg border border-orange-500 px-3 py-2 text-base text-orange-700 placeholder:text-orange-400"
                placeholder="vous@exemple.fr"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Mot de passe
              <span className="relative">
                <input
                  type={voirMdp ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-orange-500 px-3 py-2 pr-10 text-base text-orange-700 placeholder:text-orange-400"
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

            {state?.erreur && (
              <p
                role="alert"
                className="rounded-lg bg-red-600/15 px-3 py-2 text-sm text-red-700"
              >
                {state.erreur}
              </p>
            )}

            {erreur === "config" && (
              <p
                role="alert"
                className="rounded-lg bg-red-600/15 px-3 py-2 text-sm text-red-700"
              >
                Configuration incomplète : ajoutez NEXT_PUBLIC_SUPABASE_URL et
                NEXT_PUBLIC_SUPABASE_ANON_KEY dans les variables
                d&apos;environnement Vercel, puis redéployez.
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {pending ? "Connexion…" : "Se connecter"}
            </button>

            <button
              type="button"
              onClick={() => setModeReset(true)}
              className="text-center text-sm font-medium opacity-70 transition hover:opacity-100"
            >
              Mot de passe oublié ?
            </button>
          </form>
        )}
      </div>
    </div>
  );
}