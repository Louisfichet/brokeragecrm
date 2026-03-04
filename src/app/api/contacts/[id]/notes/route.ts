import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  unauthorized,
  badRequest,
  notFound,
  serverError,
} from "@/lib/api-helpers";

// POST /api/contacts/[id]/notes
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const contact = await prisma.contact.findUnique({ where: { id: params.id } });
    if (!contact) return notFound("Contact introuvable");

    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) return badRequest("Le titre et le contenu sont requis");

    const note = await prisma.contactNote.create({
      data: { contactId: params.id, title, content },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
