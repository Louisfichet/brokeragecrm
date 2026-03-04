import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  unauthorized,
  badRequest,
  notFound,
  serverError,
} from "@/lib/api-helpers";

// POST /api/companies/[id]/contacts — Ajouter un contact à une société
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
    const { firstName, lastName, email, phone, role } = body;

    if (!firstName) return badRequest("Le prénom est requis");
    if (!email && !phone) return badRequest("Un email ou un téléphone est requis");

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        role: role || null,
        companyId: params.id,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
