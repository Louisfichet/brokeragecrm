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

// GET /api/companies/[id] — Détail d'une société
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        types: true,
        searchTypes: { include: { searchType: true } },
        createdBy: { select: { name: true } },
        contacts: { orderBy: { createdAt: "desc" } },
        notes: { orderBy: { createdAt: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        specs: { include: { criteria: true } },
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

    if (!company) return notFound("Société introuvable");

    if (company.isHidden && !isAdmin(session)) {
      return notFound("Société introuvable");
    }

    return NextResponse.json(company);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/companies/[id] — Modifier une société
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const {
      name, website, description, types, searchTypeLabels, isHidden,
      formeJuridique, capitalSocial, siret, villeRCS, adresseSiege,
      representantCivilite, representantPrenom, representantNom, representantQualite,
    } = body;

    // Toggle visibilité (admin uniquement)
    if (isHidden !== undefined && !isAdmin(session)) {
      return forbidden();
    }

    const existing = await prisma.company.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Société introuvable");

    // Si c'est juste un toggle de visibilité
    if (isHidden !== undefined && name === undefined) {
      const updated = await prisma.company.update({
        where: { id: params.id },
        data: { isHidden },
        include: { types: true, searchTypes: { include: { searchType: true } } },
      });
      logActivity({
        userId: session.user.id,
        action: "UPDATE",
        entity: "COMPANY",
        entityId: params.id,
        entityLabel: existing.name,
        details: { isHidden },
      });
      return NextResponse.json(updated);
    }

    if (!name) return badRequest("Le nom est requis");

    // Mettre à jour les types : supprimer les anciens, créer les nouveaux
    if (types) {
      await prisma.companyType.deleteMany({ where: { companyId: params.id } });
    }

    // Mettre à jour les types de recherche
    let searchTypeConnects: { searchTypeId: string }[] | undefined;
    if (searchTypeLabels !== undefined) {
      await prisma.companySearchType.deleteMany({ where: { companyId: params.id } });
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

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        name,
        website: website || null,
        description: description || null,
        ...(isHidden !== undefined && { isHidden }),
        ...(formeJuridique !== undefined && { formeJuridique: formeJuridique || null }),
        ...(capitalSocial !== undefined && { capitalSocial: capitalSocial || null }),
        ...(siret !== undefined && { siret: siret || null }),
        ...(villeRCS !== undefined && { villeRCS: villeRCS || null }),
        ...(adresseSiege !== undefined && { adresseSiege: adresseSiege || null }),
        ...(representantCivilite !== undefined && { representantCivilite: representantCivilite || null }),
        ...(representantPrenom !== undefined && { representantPrenom: representantPrenom || null }),
        ...(representantNom !== undefined && { representantNom: representantNom || null }),
        ...(representantQualite !== undefined && { representantQualite: representantQualite || null }),
        ...(types && {
          types: { create: types.map((t: string) => ({ type: t })) },
        }),
        ...(searchTypeConnects && {
          searchTypes: { create: searchTypeConnects },
        }),
      },
      include: { types: true, searchTypes: { include: { searchType: true } } },
    });

    logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entity: "COMPANY",
      entityId: params.id,
      entityLabel: name,
    });

    return NextResponse.json(company);
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/companies/[id] — Supprimer une société (admin uniquement)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const existing = await prisma.company.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Société introuvable");

    await prisma.company.delete({ where: { id: params.id } });

    logActivity({
      userId: session.user.id,
      action: "DELETE",
      entity: "COMPANY",
      entityId: params.id,
      entityLabel: existing.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
