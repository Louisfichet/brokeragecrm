import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, serverError } from "@/lib/api-helpers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/properties/[id]/photos — Upload photos
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
    const files = formData.getAll("photos") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "Au moins une photo est requise" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "uploads", "properties", params.id, "photos");
    await mkdir(uploadDir, { recursive: true });

    const currentCount = await prisma.propertyPhoto.count({ where: { propertyId: params.id } });

    const photos = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${i}-${file.name}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      const photo = await prisma.propertyPhoto.create({
        data: {
          propertyId: params.id,
          filePath: `/uploads/properties/${params.id}/photos/${fileName}`,
          fileName: file.name,
          mimeType: file.type || null,
          size: file.size || null,
          order: currentCount + i,
        },
      });
      photos.push(photo);
    }

    return NextResponse.json(photos, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
