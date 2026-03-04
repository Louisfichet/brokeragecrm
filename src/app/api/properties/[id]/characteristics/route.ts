import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, badRequest, serverError } from "@/lib/api-helpers";

// POST /api/properties/[id]/characteristics
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) return notFound("Bien introuvable");

    const body = await req.json();
    const { label, value } = body;

    if (!label || !value) return badRequest("Le label et la valeur sont requis");

    // Ajouter le label au catalogue global s'il n'existe pas
    await prisma.characteristicLabel.upsert({
      where: { label },
      update: {},
      create: { label, isDefault: false },
    });

    const characteristic = await prisma.propertyCharacteristic.create({
      data: { propertyId: params.id, label, value },
    });

    return NextResponse.json(characteristic, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
