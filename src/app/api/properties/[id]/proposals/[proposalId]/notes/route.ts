import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, badRequest, serverError } from "@/lib/api-helpers";

// POST /api/properties/[id]/proposals/[proposalId]/notes
export async function POST(
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
    const { title, content } = body;

    if (!title || !content) return badRequest("Le titre et le contenu sont requis");

    const note = await prisma.proposalNote.create({
      data: { proposalId: params.proposalId, title, content },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
