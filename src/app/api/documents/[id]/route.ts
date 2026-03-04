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

// GET /api/documents/[id] — Détail d'un document
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const document = await prisma.generatedDocument.findUnique({
      where: { id: params.id },
      include: {
        company: { select: { id: true, name: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        property: {
          select: { id: true, reference: true, address: true, city: true },
        },
        createdBy: { select: { name: true } },
      },
    });

    if (!document) return notFound("Document introuvable");

    return NextResponse.json(document);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/documents/[id] — Mettre à jour un document
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const document = await prisma.generatedDocument.findUnique({
      where: { id: params.id },
    });
    if (!document) return notFound("Document introuvable");

    const body = await req.json();
    const { formData, editedContent, status } = body;

    const updateData: Record<string, unknown> = {};
    if (formData !== undefined) updateData.formData = formData;
    if (editedContent !== undefined) updateData.editedContent = editedContent;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.generatedDocument.update({
      where: { id: params.id },
      data: updateData,
      include: {
        company: { select: { id: true, name: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true },
        },
        property: {
          select: { id: true, reference: true, address: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/documents/[id] — Supprimer un document
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const document = await prisma.generatedDocument.findUnique({
      where: { id: params.id },
    });
    if (!document) return notFound("Document introuvable");

    await prisma.generatedDocument.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
