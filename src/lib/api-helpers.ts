import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getSession() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session;
}

export function unauthorized() {
  return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
}

export function notFound(message = "Ressource introuvable") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(message = "Requête invalide") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(error: unknown) {
  console.error(error);
  return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
}

export function isAdmin(session: { user: { role: string } }) {
  return session.user.role === "ADMIN";
}
