import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, notFound, serverError, isAdmin } from "@/lib/api-helpers";
import { unlink } from "fs/promises";
import path from "path";

// DELETE /api/properties/[id]/documents/[documentId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const doc = await prisma.propertyDocument.findFirst({
      where: { id: params.documentId, propertyId: params.id },
    });
    if (!doc) return notFound("Document introuvable");

    try {
      await unlink(path.join(process.cwd(), doc.filePath));
    } catch { /* déjà supprimé */ }

    await prisma.propertyDocument.delete({ where: { id: params.documentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
