import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Variables d'environnement absentes (configuration Vercel incomplète) :
    // on laisse la page /login s'afficher avec un message explicite au lieu
    // de se rediriger soi-même en boucle.
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.next({ request });
    }
    return NextResponse.redirect(new URL("/login?erreur=config", request.url));
  }

  // Cookies à reporter sur la réponse finale (surtout les redirections) :
  // si le jeton a été renouvelé pendant la requête, ces cookies doivent
  // accompagner la redirection, sinon le nouveau jeton est perdu et le
  // refresh token (rotatif) déjà consommé provoque une boucle infinie.
  let cookiesAReporter: { name: string; value: string }[] = [];

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        cookiesAReporter = cookiesToSet;
        cookiesToSet.forEach(({ name, value }) =>
          response.cookies.set(name, value)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = request.nextUrl.pathname.startsWith("/login");
  const isReinit = request.nextUrl.pathname.startsWith("/reinitialiser");
  const isPublic = request.nextUrl.pathname.startsWith("/_next");

  const reporterCookies = (cible: NextResponse) => {
    cookiesAReporter.forEach(({ name, value }) => cible.cookies.set(name, value));
    return cible;
  };

  if (!user && !isLogin && !isReinit && !isPublic) {
    return reporterCookies(NextResponse.redirect(new URL("/login", request.url)));
  }
  if (user && isLogin) {
    return reporterCookies(
      NextResponse.redirect(new URL("/tableau", request.url))
    );
  }
  // Anti-cache : forcer le rechargement à chaque visite pour que les
  // navigateurs (surtout mobiles) ne servent jamais un ancien build.
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, s-maxage=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Surrogate-Control", "no-store");

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif)$).*)",
  ],
};