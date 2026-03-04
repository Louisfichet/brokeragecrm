import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, notFound, serverError, isAdmin } from "@/lib/api-helpers";
import { unlink } from "fs/promises";
import path from "path";

// DELETE /api/properties/[id]/photos/[photoId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const photo = await prisma.propertyPhoto.findFirst({
      where: { id: params.photoId, propertyId: params.id },
    });
    if (!photo) return notFound("Photo introuvable");

    try {
      await unlink(path.join(process.cwd(), photo.filePath));
    } catch {
      // Fichier déjà supprimé
    }

    await prisma.propertyPhoto.delete({ where: { id: params.photoId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
