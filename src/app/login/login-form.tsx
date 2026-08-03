"use client";

import { useActionState } from "react";
import { TreeDeciduous } from "lucide-react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = undefined;

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-current/10 bg-current/0 p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-700 text-emerald-50">
            <TreeDeciduous className="h-8 w-8" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-bold">Généalogie Toa-Zéo</h1>
            <p className="text-sm opacity-70">
              L&apos;arbre du village — espace réservé aux membres.
            </p>
          </div>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className="rounded-lg border px-3 py-2 text-base"
              placeholder="vous@exemple.fr"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Mot de passe
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="rounded-lg border px-3 py-2 text-base"
              placeholder="••••••••"
            />
          </label>

          {state?.erreur && (
            <p
              role="alert"
              className="rounded-lg bg-red-600/15 px-3 py-2 text-sm text-red-700"
            >
              {state.erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-800 disabled:opacity-60"
          >
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}