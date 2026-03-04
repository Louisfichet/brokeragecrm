import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  isAdmin,
} from "@/lib/api-helpers";
import { unlink } from "fs/promises";
import path from "path";

// DELETE /api/contacts/[id]/documents/[documentId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const document = await prisma.contactDocument.findFirst({
      where: { id: params.documentId, contactId: params.id },
    });
    if (!document) return notFound("Document introuvable");

    try {
      const fullPath = path.join(process.cwd(), document.filePath);
      await unlink(fullPath);
    } catch {
      // Fichier déjà supprimé
    }

    await prisma.contactDocument.delete({ where: { id: params.documentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
