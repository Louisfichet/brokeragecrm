import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isLoginPage = nextUrl.pathname === "/login";
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

  // Laisser passer les routes d'auth API
  if (isApiAuth) return NextResponse.next();

  // Rediriger vers /biens si déjà connecté et sur /login
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/biens", nextUrl));
  }

  // Rediriger vers /login si non connecté
  if (!isLoginPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Protéger les routes admin
  if (nextUrl.pathname.startsWith("/parametres")) {
    const role = req.auth?.user?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/biens", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
