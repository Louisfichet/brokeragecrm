import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, serverError } from "@/lib/api-helpers";

// GET /api/folders?entityType=PROPERTY&entityId=xxx&parentId=yyy
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") as "PROPERTY" | "COMPANY" | "CONTACT";
    const entityId = searchParams.get("entityId");
    const parentId = searchParams.get("parentId") || null;

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType et entityId requis" }, { status: 400 });
    }

    const folders = await prisma.documentFolder.findMany({
      where: { entityType, entityId, parentId },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            children: true,
            propertyDocuments: entityType === "PROPERTY" ? true : false,
            companyDocuments: entityType === "COMPANY" ? true : false,
            contactDocuments: entityType === "CONTACT" ? true : false,
          },
        },
      },
    });

    return NextResponse.json(folders);
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/folders — Créer un dossier
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { name, entityType, entityId, parentId } = body;

    if (!name || !entityType || !entityId) {
      return NextResponse.json({ error: "name, entityType et entityId requis" }, { status: 400 });
    }

    // Vérifier que le parent appartient à la même entité
    if (parentId) {
      const parent = await prisma.documentFolder.findFirst({
        where: { id: parentId, entityType, entityId },
      });
      if (!parent) {
        return NextResponse.json({ error: "Dossier parent introuvable" }, { status: 404 });
      }
    }

    const folder = await prisma.documentFolder.create({
      data: {
        name,
        entityType,
        entityId,
        parentId: parentId || null,
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
