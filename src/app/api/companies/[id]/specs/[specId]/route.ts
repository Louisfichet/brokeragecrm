import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, serverError } from "@/lib/api-helpers";

// PUT /api/companies/[id]/specs/[specId] — Modifier un cahier des charges
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; specId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const spec = await prisma.companySpec.findFirst({
      where: { id: params.specId, companyId: params.id },
    });
    if (!spec) return notFound("Cahier des charges introuvable");

    const body = await req.json();

    const updated = await prisma.companySpec.update({
      where: { id: params.specId },
      data: {
        budgetMin: body.budgetMin,
        budgetMax: body.budgetMax,
        propertyTypes: body.propertyTypes || [],
        locations: body.locations || [],
        minYield: body.minYield,
        freeText: body.freeText,
      },
      include: { criteria: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverError(error);
  }
}
