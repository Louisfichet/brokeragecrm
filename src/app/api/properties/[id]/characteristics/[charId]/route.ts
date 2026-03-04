import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, serverError } from "@/lib/api-helpers";

// PUT /api/properties/[id]/characteristics/[charId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; charId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const char = await prisma.propertyCharacteristic.findFirst({
      where: { id: params.charId, propertyId: params.id },
    });
    if (!char) return notFound("Caractéristique introuvable");

    const body = await req.json();

    const updated = await prisma.propertyCharacteristic.update({
      where: { id: params.charId },
      data: { value: body.value },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/properties/[id]/characteristics/[charId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; charId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const char = await prisma.propertyCharacteristic.findFirst({
      where: { id: params.charId, propertyId: params.id },
    });
    if (!char) return notFound("Caractéristique introuvable");

    await prisma.propertyCharacteristic.delete({ where: { id: params.charId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
