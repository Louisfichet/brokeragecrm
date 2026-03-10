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
    const files = formData.getAll("files") as File[];
    const folderId = formData.get("folderId") as string | null;

    // Support ancien format (single file avec title)
    const singleFile = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const note = formData.get("note") as string | null;

    const uploadDir = path.join(process.cwd(), "uploads", "properties", params.id, "docs");
    await mkdir(uploadDir, { recursive: true });

    const created = [];

    if (singleFile && title) {
      // Mode legacy: 1 fichier avec titre
      const bytes = await singleFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${singleFile.name}`;
      await writeFile(path.join(uploadDir, fileName), buffer);

      const document = await prisma.propertyDocument.create({
        data: {
          propertyId: params.id,
          folderId: folderId || null,
          title,
          note: note || null,
          filePath: `/uploads/properties/${params.id}/docs/${fileName}`,
          fileName: singleFile.name,
          mimeType: singleFile.type || null,
          size: singleFile.size || null,
        },
      });
      created.push(document);
    } else if (files.length > 0) {
      // Mode multi-fichiers: titre = nom du fichier
      for (const file of files) {
        if (!(file instanceof File) || file.size === 0) continue;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${Date.now()}-${file.name}`;
        await writeFile(path.join(uploadDir, fileName), buffer);

        const document = await prisma.propertyDocument.create({
          data: {
            propertyId: params.id,
            folderId: folderId || null,
            title: file.name,
            note: null,
            filePath: `/uploads/properties/${params.id}/docs/${fileName}`,
            fileName: file.name,
            mimeType: file.type || null,
            size: file.size || null,
          },
        });
        created.push(document);
      }
    } else {
      return NextResponse.json({ error: "Au moins un fichier est requis" }, { status: 400 });
    }

    return NextResponse.json(created.length === 1 ? created[0] : created, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
