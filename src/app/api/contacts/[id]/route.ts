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
import { logActivity } from "@/lib/activity-logger";

// GET /api/contacts/[id] — Détail d'un contact
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        company: { include: { types: true } },
        searchTypes: { include: { searchType: true } },
        createdBy: { select: { name: true } },
        notes: { orderBy: { createdAt: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        propertiesApported: {
          include: { createdBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        proposalsReceived: {
          include: {
            property: true,
            notes: { orderBy: { createdAt: "desc" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!contact) return notFound("Contact introuvable");

    if (contact.isHidden && !isAdmin(session)) {
      return notFound("Contact introuvable");
    }

    return NextResponse.json(contact);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/contacts/[id] — Modifier un contact
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, role, companyId, isHidden, civilite, adresse, searchTypeLabels } = body;

    if (isHidden !== undefined && !isAdmin(session)) {
      return forbidden();
    }

    const existing = await prisma.contact.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Contact introuvable");

    // Toggle visibilité seul
    if (isHidden !== undefined && firstName === undefined) {
      const updated = await prisma.contact.update({
        where: { id: params.id },
        data: { isHidden },
        include: { company: { include: { types: true } }, searchTypes: { include: { searchType: true } } },
      });
      logActivity({
        userId: session.user.id,
        action: "UPDATE",
        entity: "CONTACT",
        entityId: params.id,
        entityLabel: `${existing.firstName} ${existing.lastName || ""}`.trim(),
        details: { isHidden },
      });
      return NextResponse.json(updated);
    }

    if (!firstName) return badRequest("Le prénom est requis");
    if (!email && !phone) return badRequest("Un email ou un téléphone est requis");

    // Mettre à jour les types de recherche
    let searchTypeConnects: { searchTypeId: string }[] | undefined;
    if (searchTypeLabels !== undefined) {
      await prisma.contactSearchType.deleteMany({ where: { contactId: params.id } });
      if (searchTypeLabels.length > 0) {
        const searchTypes = await Promise.all(
          searchTypeLabels.map((label: string) =>
            prisma.searchType.upsert({
              where: { label: label.trim() },
              update: {},
              create: { label: label.trim() },
            })
          )
        );
        searchTypeConnects = searchTypes.map((st) => ({ searchTypeId: st.id }));
      }
    }

    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        role: role || null,
        companyId: companyId || null,
        ...(isHidden !== undefined && { isHidden }),
        ...(civilite !== undefined && { civilite: civilite || null }),
        ...(adresse !== undefined && { adresse: adresse || null }),
        ...(searchTypeConnects && {
          searchTypes: { create: searchTypeConnects },
        }),
      },
      include: { company: { include: { types: true } }, searchTypes: { include: { searchType: true } } },
    });

    logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entity: "CONTACT",
      entityId: params.id,
      entityLabel: `${firstName} ${lastName || ""}`.trim(),
    });

    return NextResponse.json(contact);
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/contacts/[id] — Supprimer un contact (admin uniquement)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const existing = await prisma.contact.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Contact introuvable");

    await prisma.contact.delete({ where: { id: params.id } });

    logActivity({
      userId: session.user.id,
      action: "DELETE",
      entity: "CONTACT",
      entityId: params.id,
      entityLabel: `${existing.firstName} ${existing.lastName || ""}`.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
