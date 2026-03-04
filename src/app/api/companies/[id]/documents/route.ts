import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, serverError } from "@/lib/api-helpers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/companies/[id]/documents — Upload un document
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const company = await prisma.company.findUnique({ where: { id: params.id } });
    if (!company) return notFound("Société introuvable");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const note = formData.get("note") as string | null;

    if (!file || !title) {
      return NextResponse.json(
        { error: "Le fichier et le titre sont requis" },
        { status: 400 }
      );
    }

    // Créer le dossier d'upload
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "companies",
      params.id
    );
    await mkdir(uploadDir, { recursive: true });

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const document = await prisma.companyDocument.create({
      data: {
        companyId: params.id,
        title,
        note: note || null,
        filePath: `/uploads/companies/${params.id}/${fileName}`,
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
