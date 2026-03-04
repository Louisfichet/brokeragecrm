import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, serverError } from "@/lib/api-helpers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/properties/[id]/documents
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) return notFound("Bien introuvable");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const note = formData.get("note") as string | null;

    if (!file || !title) {
      return NextResponse.json({ error: "Le fichier et le titre sont requis" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "uploads", "properties", params.id, "docs");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name}`;
    await writeFile(path.join(uploadDir, fileName), buffer);

    const document = await prisma.propertyDocument.create({
      data: {
        propertyId: params.id,
        title,
        note: note || null,
        filePath: `/uploads/properties/${params.id}/docs/${fileName}`,
        fileName: file.name,
        mimeType: file.type || null,
        size: file.size || null,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
