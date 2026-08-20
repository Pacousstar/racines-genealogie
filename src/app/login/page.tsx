import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-blue-900">Configuration manquante</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Les variables <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
            NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
            NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ne sont pas définies dans les
            paramètres Vercel (Settings → Environment Variables). Ajoutez-les,
            puis redéployez.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/tableau");
  }

  return <LoginForm erreur={erreur} />;
}