import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, badRequest, serverError } from "@/lib/api-helpers";

// GET /api/search-types — Liste des types de recherche existants
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const where = q
      ? { label: { contains: q, mode: "insensitive" as const } }
      : {};

    const searchTypes = await prisma.searchType.findMany({
      where,
      orderBy: { label: "asc" },
      take: 50,
    });

    return NextResponse.json(searchTypes);
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/search-types — Créer un type de recherche
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { label } = body;

    if (!label || !label.trim()) {
      return badRequest("Le label est requis");
    }

    const searchType = await prisma.searchType.upsert({
      where: { label: label.trim() },
      update: {},
      create: { label: label.trim() },
    });

    return NextResponse.json(searchType, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
