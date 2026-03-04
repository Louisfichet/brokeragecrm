import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, badRequest, serverError } from "@/lib/api-helpers";

// PUT /api/properties/[id]/proposals/[proposalId]/notes/[noteId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; proposalId: string; noteId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const note = await prisma.proposalNote.findFirst({
      where: { id: params.noteId, proposalId: params.proposalId },
    });
    if (!note) return notFound("Note introuvable");

    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) return badRequest("Le titre et le contenu sont requis");

    const updated = await prisma.proposalNote.update({
      where: { id: params.noteId },
      data: { title, content },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/properties/[id]/proposals/[proposalId]/notes/[noteId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; proposalId: string; noteId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const note = await prisma.proposalNote.findFirst({
      where: { id: params.noteId, proposalId: params.proposalId },
    });
    if (!note) return notFound("Note introuvable");

    await prisma.proposalNote.delete({ where: { id: params.noteId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
