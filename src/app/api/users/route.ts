import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession, unauthorized, forbidden, badRequest, serverError, isAdmin,
} from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";
import bcrypt from "bcryptjs";

// GET /api/users — Liste des utilisateurs (admin uniquement)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { propertiesCreated: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/users — Créer un utilisateur (admin uniquement)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return badRequest("Nom, email et mot de passe sont requis");
    }

    if (password.length < 6) {
      return badRequest("Le mot de passe doit contenir au moins 6 caractères");
    }

    // Vérifier l'unicité de l'email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return badRequest("Un utilisateur avec cet email existe déjà");

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "FREELANCE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    logActivity({
      userId: session.user.id,
      action: "CREATE",
      entity: "USER",
      entityId: user.id,
      entityLabel: `${user.name} (${user.role})`,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
