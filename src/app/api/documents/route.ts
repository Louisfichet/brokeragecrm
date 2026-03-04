import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  unauthorized,
  serverError,
  badRequest,
  isAdmin,
} from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";

// GET /api/documents — Liste des documents
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
        { contact: { firstName: { contains: search, mode: "insensitive" } } },
        { contact: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [documents, total] = await Promise.all([
      prisma.generatedDocument.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          contact: {
            select: { id: true, firstName: true, lastName: true },
          },
          property: {
            select: { id: true, reference: true, address: true },
          },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.generatedDocument.count({ where }),
    ]);

    return NextResponse.json({
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

// Helper: générer la référence du document
async function generateReference(
  type: string,
  counterpartyName: string
): Promise<string> {
  const year = new Date().getFullYear();

  const counter = await prisma.documentReferenceCounter.upsert({
    where: { year },
    update: { count: { increment: 1 } },
    create: { year, count: 1 },
  });

  // Nettoyer le nom (majuscules, sans accents, sans espaces)
  const cleanName = counterpartyName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .substring(0, 20);

  const typeCode: Record<string, string> = {
    NDA_TYPE1: "NDA",
    NDA_TYPE2: "NDA",
    INTERCAB: "INTERCAB",
    MANDAT: "MANDAT",
  };

  const num = String(counter.count).padStart(3, "0");
  return `${typeCode[type] || type}-PARKTO-${cleanName}-${year}-${num}`;
}

// POST /api/documents — Créer un document (brouillon)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { type, companyId, contactId, propertyId, formData, counterpartyName } = body;

    if (!type || !formData) {
      return badRequest("Type et données du formulaire requis");
    }

    // Au moins une contrepartie (société ou contact)
    if (!companyId && !contactId) {
      return badRequest("Une contrepartie (société ou contact) est requise");
    }

    // Déterminer le nom pour la référence
    let refName = counterpartyName || "";
    if (!refName && companyId) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      refName = company?.name || "INCONNU";
    }
    if (!refName && contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: contactId } });
      refName = contact ? `${contact.firstName}${contact.lastName || ""}` : "INCONNU";
    }

    const reference = await generateReference(type, refName);

    const document = await prisma.generatedDocument.create({
      data: {
        reference,
        type,
        status: "DRAFT",
        companyId: companyId || null,
        contactId: contactId || null,
        propertyId: propertyId || null,
        formData,
        createdById: session.user.id,
      },
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

    logActivity({
      userId: session.user.id,
      action: "CREATE",
      entity: "DOCUMENT",
      entityId: document.id,
      entityLabel: reference,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
