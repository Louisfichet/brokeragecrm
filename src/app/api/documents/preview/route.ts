import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, serverError } from "@/lib/api-helpers";
import { CompanySettingsData } from "@/lib/pdf/pdf-engine";
import { generateNdaSections } from "@/lib/pdf/templates/nda";
import { generateIntercabSections } from "@/lib/pdf/templates/intercab";

// POST /api/documents/preview — Générer les sections pour aperçu HTML
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { type, formData, propertyId } = body;

    if (!type || !formData) {
      return NextResponse.json(
        { error: "Type et formData requis" },
        { status: 400 }
      );
    }

    // Charger les paramètres société
    const settings = await prisma.companySettings.findFirst();
    if (!settings) {
      return NextResponse.json(
        { error: "Paramètres société non configurés" },
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

    // Enrichir avec le bien si lié
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedFormData = { ...formData } as any;
    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { address: true, city: true, priceFAI: true },
      });
      if (property) {
        enrichedFormData.property = {
          address: property.address,
          city: property.city,
          priceFAI: property.priceFAI ? Number(property.priceFAI) : null,
        };
        enrichedFormData.linkedProperty = true;
      }
    }

    // Générer les sections selon le type
    let sections;
    switch (type) {
      case "NDA_TYPE1":
      case "NDA_TYPE2":
        enrichedFormData.documentType = type;
        sections = generateNdaSections(enrichedFormData, settingsData);
        break;

      case "INTERCAB":
        sections = generateIntercabSections(enrichedFormData, settingsData);
        break;

      default:
        return NextResponse.json(
          { error: `Type non supporté: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      sections,
      companyName: settings.raisonSociale,
    });
  } catch (error) {
    return serverError(error);
  }
}
