import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  unauthorized,
  badRequest,
  serverError,
  isAdmin,
} from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";

// GET /api/contacts — Liste des contacts (optionnel: indépendants uniquement)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const independent = searchParams.get("independent") === "true";
    const searchType = searchParams.get("searchType") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (!isAdmin(session)) {
      where.isHidden = false;
    }

    if (independent) {
      where.companyId = null;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    if (searchType) {
      where.searchTypes = { some: { searchType: { label: searchType } } };
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          company: { include: { types: true } },
          searchTypes: { include: { searchType: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({
      data: contacts,
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

// POST /api/contacts — Créer un contact
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, role, companyId, searchTypeLabels } = body;

    if (!firstName) {
      return badRequest("Le prénom est requis");
    }

    if (!email && !phone) {
      return badRequest("Un email ou un téléphone est requis");
    }

    // Upsert search types if provided
    let searchTypeConnects: { searchTypeId: string }[] = [];
    if (searchTypeLabels && searchTypeLabels.length > 0) {
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

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        role: role || null,
        companyId: companyId || null,
        createdById: session.user.id,
        ...(searchTypeConnects.length > 0 && {
          searchTypes: { create: searchTypeConnects },
        }),
      },
      include: { company: { include: { types: true } }, searchTypes: { include: { searchType: true } } },
    });

    logActivity({
      userId: session.user.id,
      action: "CREATE",
      entity: "CONTACT",
      entityId: contact.id,
      entityLabel: `${contact.firstName} ${contact.lastName || ""}`.trim(),
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
