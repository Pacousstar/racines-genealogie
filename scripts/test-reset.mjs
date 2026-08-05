import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.trim().match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/[\r"']/g, "").trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const email = "test.redirect.qz9876@gmail.com";
const redirectTo = "https://racines-genealogie-o2d3.vercel.app/reinitialiser";

const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo,
});

if (error) {
  console.log("ERREUR récupérée :", error.message);
  console.log("Statut :", error.status);
} else {
  console.log("OK — l'email a été accepté (ou envoyé).");
}

// La même sans redirectTo pour comparer
const { error: err2 } = await supabase.auth.resetPasswordForEmail(email);
if (err2) {
  console.log("Sans redirectTo — ERREUR :", err2.message, "| statut", err2.status);
} else {
  console.log("Sans redirectTo — OK.");
}