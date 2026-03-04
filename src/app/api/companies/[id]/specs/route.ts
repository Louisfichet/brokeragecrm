import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, serverError } from "@/lib/api-helpers";

// POST /api/companies/[id]/specs — Créer un cahier des charges
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const company = await prisma.company.findUnique({ where: { id: params.id } });
    if (!company) return notFound("Société introuvable");

    const body = await req.json();

    const spec = await prisma.companySpec.create({
      data: {
        companyId: params.id,
        budgetMin: body.budgetMin,
        budgetMax: body.budgetMax,
        propertyTypes: body.propertyTypes || [],
        locations: body.locations || [],
        minYield: body.minYield,
        freeText: body.freeText,
      },
      include: { criteria: true },
    });

    return NextResponse.json(spec, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
