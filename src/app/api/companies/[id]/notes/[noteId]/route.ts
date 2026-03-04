import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  serverError,
  isAdmin,
} from "@/lib/api-helpers";

// PUT /api/companies/[id]/notes/[noteId] — Modifier une note
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const note = await prisma.companyNote.findFirst({
      where: { id: params.noteId, companyId: params.id },
    });
    if (!note) return notFound("Note introuvable");

    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) return badRequest("Le titre et le contenu sont requis");

    const updated = await prisma.companyNote.update({
      where: { id: params.noteId },
      data: { title, content },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/companies/[id]/notes/[noteId] — Supprimer une note (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const note = await prisma.companyNote.findFirst({
      where: { id: params.noteId, companyId: params.id },
    });
    if (!note) return notFound("Note introuvable");

    await prisma.companyNote.delete({ where: { id: params.noteId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
