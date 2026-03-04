import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, serverError } from "@/lib/api-helpers";

// PUT /api/properties/[id]/proposals/[proposalId] — Toggle statut
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; proposalId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const proposal = await prisma.propertyProposal.findFirst({
      where: { id: params.proposalId, propertyId: params.id },
    });
    if (!proposal) return notFound("Proposition introuvable");

    const body = await req.json();

    const updated = await prisma.propertyProposal.update({
      where: { id: params.proposalId },
      data: { status: body.status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverError(error);
  }
}
