import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, badRequest, serverError } from "@/lib/api-helpers";

// POST /api/properties/[id]/proposals — Proposer à une société ou un contact
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) return notFound("Bien introuvable");

    const body = await req.json();
    const { companyId, contactId } = body;

    if (!companyId && !contactId) return badRequest("Une société ou un contact est requis");
    if (companyId && contactId) return badRequest("Choisissez une société OU un contact, pas les deux");

    // Vérifier que la proposition n'existe pas déjà
    if (companyId) {
      const existing = await prisma.propertyProposal.findUnique({
        where: { propertyId_companyId: { propertyId: params.id, companyId } },
      });
      if (existing) return badRequest("Ce bien a déjà été proposé à cette société");
    } else {
      const existing = await prisma.propertyProposal.findUnique({
        where: { propertyId_contactId: { propertyId: params.id, contactId } },
      });
      if (existing) return badRequest("Ce bien a déjà été proposé à ce contact");
    }

    const proposal = await prisma.propertyProposal.create({
      data: {
        propertyId: params.id,
        ...(companyId ? { companyId } : { contactId }),
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, company: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
