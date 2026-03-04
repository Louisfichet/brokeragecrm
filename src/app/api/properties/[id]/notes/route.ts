import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, badRequest, notFound, serverError } from "@/lib/api-helpers";

// POST /api/properties/[id]/notes
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
    const { title, content } = body;

    if (!title || !content) return badRequest("Le titre et le contenu sont requis");

    const note = await prisma.propertyNote.create({
      data: { propertyId: params.id, title, content },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
