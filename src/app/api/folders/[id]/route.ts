import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, serverError } from "@/lib/api-helpers";

// PUT /api/folders/[id] — Renommer un dossier
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const folder = await prisma.documentFolder.findUnique({ where: { id: params.id } });
    if (!folder) return notFound("Dossier introuvable");

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "name requis" }, { status: 400 });
    }

    const updated = await prisma.documentFolder.update({
      where: { id: params.id },
      data: { name },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/folders/[id] — Supprimer un dossier (cascade)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const folder = await prisma.documentFolder.findUnique({ where: { id: params.id } });
    if (!folder) return notFound("Dossier introuvable");

    // La suppression cascade les sous-dossiers via Prisma
    // Les documents gardent folderId=null (onDelete: SetNull)
    await prisma.documentFolder.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
