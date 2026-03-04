import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, badRequest, serverError, isAdmin } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";

// GET /api/properties — Liste des biens
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const city = searchParams.get("city") || "";
    const postalCode = searchParams.get("postalCode") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const all = searchParams.get("all") === "true"; // Pour la carte
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Freelances ne voient pas les biens cachés
    if (!isAdmin(session)) {
      where.isHidden = false;
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (postalCode) {
      where.postalCode = { contains: postalCode };
    }

    if (all) {
      // Retourner tous les biens pour la carte (avec lat/lng)
      const properties = await prisma.property.findMany({
        where: { ...where, lat: { not: null }, lng: { not: null } },
        select: {
          id: true,
          reference: true,
          address: true,
          city: true,
          lat: true,
          lng: true,
          apportedByCompany: { select: { id: true, name: true } },
          apportedByContact: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { proposals: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ data: properties });
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          createdBy: { select: { name: true } },
          apportedByCompany: { select: { id: true, name: true } },
          apportedByContact: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { proposals: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      data: properties,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/properties — Créer un bien
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const {
      address, city, postalCode, lat, lng,
      apportedByCompanyId, apportedByContactId,
      propertyType, rentHT, rentPeriod, priceFAI,
    } = body;

    if (!address) return badRequest("L'adresse est requise");
    if (!apportedByCompanyId && !apportedByContactId) {
      return badRequest("Un apporteur est requis");
    }
    if (!rentHT || !priceFAI) {
      return badRequest("Le loyer HT et le prix FAI sont requis");
    }
    if (!rentPeriod || !["MENSUEL", "ANNUEL"].includes(rentPeriod)) {
      return badRequest("La période du loyer est requise (MENSUEL ou ANNUEL)");
    }

    // Générer la référence AAAA-NNN
    const currentYear = new Date().getFullYear();
    const counter = await prisma.referenceCounter.upsert({
      where: { year: currentYear },
      update: { count: { increment: 1 } },
      create: { year: currentYear, count: 1 },
    });

    const reference = `${currentYear}-${String(counter.count).padStart(3, "0")}`;

    // Calculer la rentabilité
    const annualRent = rentPeriod === "MENSUEL" ? rentHT * 12 : rentHT;
    const rentability = ((annualRent / priceFAI) * 100).toFixed(2);

    const property = await prisma.property.create({
      data: {
        reference,
        address,
        city: city || null,
        postalCode: postalCode || null,
        lat: lat || null,
        lng: lng || null,
        propertyType: propertyType || null,
        rentHT: parseFloat(rentHT),
        rentPeriod,
        priceFAI: parseFloat(priceFAI),
        createdById: session.user.id,
        apportedByCompanyId: apportedByCompanyId || null,
        apportedByContactId: apportedByContactId || null,
        characteristics: {
          create: [
            { label: "Prix FAI", value: `${parseFloat(priceFAI).toLocaleString("fr-FR")} €` },
            { label: "Loyer HT", value: `${parseFloat(rentHT).toLocaleString("fr-FR")} € / ${rentPeriod === "MENSUEL" ? "mois" : "an"}` },
            { label: "Rentabilité", value: `${rentability}%` },
          ],
        },
      },
      include: {
        createdBy: { select: { name: true } },
        apportedByCompany: { select: { id: true, name: true } },
        apportedByContact: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    logActivity({
      userId: session.user.id,
      action: "CREATE",
      entity: "PROPERTY",
      entityId: property.id,
      entityLabel: `${reference} — ${address}`,
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
