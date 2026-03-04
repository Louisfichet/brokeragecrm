import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, badRequest, serverError } from "@/lib/api-helpers";

// GET /api/property-type-labels — Liste des types de bien
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const labels = await prisma.propertyTypeLabel.findMany({
      orderBy: { label: "asc" },
    });
    return NextResponse.json(labels);
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/property-type-labels — Créer un type custom
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { label } = body;

    if (!label || !label.trim()) return badRequest("Le label est requis");

    const existing = await prisma.propertyTypeLabel.findUnique({
      where: { label: label.trim() },
    });
    if (existing) return NextResponse.json(existing);

    const created = await prisma.propertyTypeLabel.create({
      data: { label: label.trim(), isDefault: false },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
