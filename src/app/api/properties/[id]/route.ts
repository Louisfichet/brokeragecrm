import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession, unauthorized, forbidden, notFound, serverError, isAdmin,
} from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";

// GET /api/properties/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { name: true } },
        apportedByCompany: { select: { id: true, name: true } },
        apportedByContact: {
          select: {
            id: true, firstName: true, lastName: true,
            company: { select: { id: true, name: true } },
          },
        },
        characteristics: { orderBy: { label: "asc" } },
        photos: { orderBy: { order: "asc" } },
        documents: { orderBy: { createdAt: "desc" } },
        notes: { orderBy: { createdAt: "desc" } },
        proposals: {
          include: {
            company: { select: { id: true, name: true } },
            contact: {
              select: {
                id: true, firstName: true, lastName: true,
                company: { select: { id: true, name: true } },
              },
            },
            notes: { orderBy: { createdAt: "desc" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!property) return notFound("Bien introuvable");

    // Freelance ne peut pas voir un bien caché
    if (property.isHidden && !isAdmin(session)) {
      return notFound("Bien introuvable");
    }

    return NextResponse.json(property);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/properties/[id] — Modifier un bien (toggle visibilité)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) return notFound("Bien introuvable");

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.isHidden !== undefined) data.isHidden = body.isHidden;

    const updated = await prisma.property.update({
      where: { id: params.id },
      data,
    });

    logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entity: "PROPERTY",
      entityId: params.id,
      entityLabel: `${property.reference} — ${property.address}`,
      details: data as Record<string, string | number | boolean>,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/properties/[id] (admin uniquement)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) return notFound("Bien introuvable");

    await prisma.property.delete({ where: { id: params.id } });

    logActivity({
      userId: session.user.id,
      action: "DELETE",
      entity: "PROPERTY",
      entityId: params.id,
      entityLabel: `${property.reference} — ${property.address}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
