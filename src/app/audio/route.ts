import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const chemin = request.nextUrl.searchParams.get("t");
  if (!chemin) return new Response("Paramètre manquant", { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("photos")
    .createSignedUrl(chemin, 3600);

  if (error || !data) {
    return new Response("Enregistrement introuvable", { status: 404 });
  }
  return NextResponse.redirect(data.signedUrl);
}