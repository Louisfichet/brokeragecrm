import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  unauthorized,
  forbidden,
  isAdmin,
  serverError,
} from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET /api/settings — Récupérer les paramètres société
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    // Récupérer ou créer les paramètres (singleton)
    let settings = await prisma.companySettings.findFirst();
    if (!settings) {
      settings = await prisma.companySettings.create({ data: {} });
    }
    return NextResponse.json(settings);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/settings — Mettre à jour les paramètres société
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    let settings = await prisma.companySettings.findFirst();
    if (!settings) {
      settings = await prisma.companySettings.create({ data: {} });
    }

    const contentType = req.headers.get("content-type") || "";

    // Upload de fichiers (signature, tampon, logo)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const fileField = formData.get("field") as string | null; // "signature", "tampon", "logo"
      const file = formData.get("file") as File | null;

      if (!file || !fileField) {
        return NextResponse.json(
          { error: "Le fichier et le champ sont requis" },
          { status: 400 }
        );
      }

      const allowedFields = ["signature", "tampon", "logo"];
      if (!allowedFields.includes(fileField)) {
        return NextResponse.json(
          { error: "Champ invalide" },
          { status: 400 }
        );
      }

      // Créer le dossier d'upload
      const uploadDir = path.join(process.cwd(), "uploads", "settings");
      await mkdir(uploadDir, { recursive: true });

      // Sauvegarder le fichier
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = file.name.split(".").pop() || "png";
      const fileName = `${fileField}.${ext}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      const dbPath = `/uploads/settings/${fileName}`;
      const updateData: Record<string, string> = {};
      if (fileField === "signature") updateData.signaturePath = dbPath;
      if (fileField === "tampon") updateData.tamponPath = dbPath;
      if (fileField === "logo") updateData.logoPath = dbPath;

      const updated = await prisma.companySettings.update({
        where: { id: settings.id },
        data: updateData,
      });

      logActivity({
        userId: session.user.id,
        action: "UPDATE",
        entity: "SETTINGS",
        entityLabel: `Upload ${fileField}`,
      });

      return NextResponse.json(updated);
    }

    // Mise à jour des champs texte (JSON body)
    const body = await req.json();
    const allowedKeys = [
      "raisonSociale",
      "formeJuridique",
      "capitalSocial",
      "numeroRCS",
      "villeRCS",
      "carteProNumero",
      "carteProMention",
      "assuranceRCP",
      "adresseSiege",
      "representantCivilite",
      "representantPrenom",
      "representantNom",
      "representantQualite",
      "emailNotification",
    ];

    const updateData: Record<string, string> = {};
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    const updated = await prisma.companySettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entity: "SETTINGS",
      entityLabel: "Paramètres société",
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverError(error);
  }
}
