// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh della sessione — intercetta "Invalid Refresh Token"
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Token invalido o scaduto: pulisci la sessione e vai al login
      if (
        error.message?.toLowerCase().includes("refresh token") ||
        error.message?.toLowerCase().includes("invalid") ||
        error.status === 400 ||
        error.status === 401
      ) {
        await supabase.auth.signOut();
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        const response = NextResponse.redirect(loginUrl);
        // Cancella tutti i cookie Supabase
        request.cookies.getAll().forEach(({ name }) => {
          if (name.startsWith("sb-")) response.cookies.delete(name);
        });
        return response;
      }
    }
    user = data?.user ?? null;
  } catch {
    // Errore di rete o altro — lascia passare
  }

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");

  // Utente non autenticato → redirect al login (tranne se già in pagine auth)
  if (!user && !isAuthPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Utente autenticato → redirect fuori dalle pagine auth
  if (user && isAuthPage) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Applica il middleware a tutte le rotte tranne:
     * - _next/static (file statici)
     * - _next/image (ottimizzazione immagini)
     * - favicon, apple-touch-icon, manifest, ecc.
     * - API routes di autenticazione Supabase
     */
    "/((?!_next/static|_next/image|favicon|apple-touch-icon|manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
