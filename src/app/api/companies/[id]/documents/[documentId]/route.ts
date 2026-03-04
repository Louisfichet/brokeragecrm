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

// DELETE /api/companies/[id]/documents/[documentId] — Supprimer un document (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const document = await prisma.companyDocument.findFirst({
      where: { id: params.documentId, companyId: params.id },
    });
    if (!document) return notFound("Document introuvable");

    // Supprimer le fichier physique
    try {
      const fullPath = path.join(process.cwd(), document.filePath);
      await unlink(fullPath);
    } catch {
      // Fichier déjà supprimé, on continue
    }

    await prisma.companyDocument.delete({ where: { id: params.documentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
