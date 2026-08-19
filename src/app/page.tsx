import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const ua = (await headers()).get("user-agent") ?? "";
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  redirect(mobile ? "/accueil" : "/tableau");
}