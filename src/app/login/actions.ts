"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { erreur?: string } | undefined;

export type ResetState = { erreur?: string; ok?: boolean } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { erreur: "Email et mot de passe sont requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { erreur: "Email ou mot de passe incorrect." };
  }

  redirect("/tableau");
}

export async function envoyerLienReset(
  _prevState: ResetState,
  formData: FormData
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { erreur: "Saisissez votre adresse e-mail." };

  const origin = String(formData.get("origin") ?? "").trim();
  const options = origin
    ? { redirectTo: `${origin}/reinitialiser` }
    : undefined;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, options);

  if (error) {
    return { erreur: `Impossible d'envoyer le lien : ${error.message}` };
  }
  return { ok: true };
}