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

// GET /api/companies — Liste des sociétés
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const searchType = searchParams.get("searchType") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (!isAdmin(session)) {
      where.isHidden = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contacts: { some: { email: { contains: search, mode: "insensitive" } } } },
        { contacts: { some: { phone: { contains: search } } } },
      ];
    }

    if (type) {
      where.types = { some: { type: type } };
    }

    if (searchType) {
      where.searchTypes = { some: { searchType: { label: searchType } } };
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          types: true,
          searchTypes: { include: { searchType: true } },
          contacts: true,
          _count: { select: { propertiesApported: true, proposalsReceived: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return NextResponse.json({
      data: companies,
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

// POST /api/companies — Créer une société
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { name, website, description, types, searchTypeLabels } = body;

    if (!name || !types || types.length === 0) {
      return badRequest("Le nom et au moins un type sont requis");
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

    const company = await prisma.company.create({
      data: {
        name,
        website: website || null,
        description: description || null,
        createdById: session.user.id,
        types: {
          create: types.map((t: string) => ({ type: t })),
        },
        ...(searchTypeConnects.length > 0 && {
          searchTypes: { create: searchTypeConnects },
        }),
      },
      include: { types: true, searchTypes: { include: { searchType: true } } },
    });

    logActivity({
      userId: session.user.id,
      action: "CREATE",
      entity: "COMPANY",
      entityId: company.id,
      entityLabel: company.name,
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
