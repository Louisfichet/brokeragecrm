import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  unauthorized,
  notFound,
  serverError,
} from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";
import { generatePdf, CompanySettingsData } from "@/lib/pdf/pdf-engine";
import { generateNdaSections } from "@/lib/pdf/templates/nda";
import { generateIntercabSections } from "@/lib/pdf/templates/intercab";
import path from "path";
import fs from "fs/promises";

// POST /api/documents/[id]/generate — Générer le PDF
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const document = await prisma.generatedDocument.findUnique({
      where: { id: params.id },
      include: {
        property: {
          select: {
            id: true,
            reference: true,
            address: true,
            city: true,
            priceFAI: true,
          },
        },
      },
    });

    if (!document) return notFound("Document introuvable");

    // Charger les paramètres société
    const settings = await prisma.companySettings.findFirst();
    if (!settings) {
      return NextResponse.json(
        { error: "Veuillez d'abord configurer les paramètres société dans Paramètres > Société" },
        { status: 400 }
      );
    }

    const settingsData: CompanySettingsData = {
      raisonSociale: settings.raisonSociale,
      formeJuridique: settings.formeJuridique,
      capitalSocial: settings.capitalSocial,
      numeroRCS: settings.numeroRCS,
      villeRCS: settings.villeRCS,
      carteProMention: settings.carteProMention,
      assuranceRCP: settings.assuranceRCP,
      adresseSiege: settings.adresseSiege,
      representantCivilite: settings.representantCivilite,
      representantPrenom: settings.representantPrenom,
      representantNom: settings.representantNom,
      representantQualite: settings.representantQualite,
      signaturePath: settings.signaturePath,
      tamponPath: settings.tamponPath,
    };

    // Construire le formData enrichi avec le bien si lié
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formData = document.formData as any;
    if (document.property) {
      formData.property = {
        address: document.property.address,
        city: document.property.city,
        priceFAI: document.property.priceFAI
          ? Number(document.property.priceFAI)
          : null,
      };
      formData.linkedProperty = true;
    }

    // Générer les sections selon le type
    let sections;
    switch (document.type) {
      case "NDA_TYPE1":
      case "NDA_TYPE2":
        formData.documentType = document.type;
        sections = generateNdaSections(formData, settingsData);
        break;

      case "INTERCAB":
        sections = generateIntercabSections(formData, settingsData);
        break;

      default:
        return NextResponse.json(
          { error: `Type de document non supporté: ${document.type}` },
          { status: 400 }
        );
    }

    // Générer le PDF
    const pdfBuffer = await generatePdf(sections, settingsData);

    // Sauvegarder le fichier
    const uploadsDir = path.join(process.cwd(), "uploads", "documents");
    await fs.mkdir(uploadsDir, { recursive: true });

    const fileName = `${document.reference}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);

    // Mettre à jour le document en base
    const relativePath = `/uploads/documents/${fileName}`;
    await prisma.generatedDocument.update({
      where: { id: params.id },
      data: {
        pdfPath: relativePath,
        status: "GENERATED",
      },
    });

    logActivity({
      userId: session.user.id,
      action: "GENERATE",
      entity: "DOCUMENT",
      entityId: params.id,
      entityLabel: document.reference,
    });

    // Retourner le PDF en réponse
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Erreur génération PDF:", error);
    return serverError(error);
  }
}
