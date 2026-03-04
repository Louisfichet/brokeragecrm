import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession, unauthorized, forbidden, notFound, badRequest, serverError, isAdmin,
} from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";
import bcrypt from "bcryptjs";

// PUT /api/users/[userId] — Modifier un utilisateur (admin uniquement)
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  try {
    const user = await prisma.user.findUnique({ where: { id: params.userId } });
    if (!user) return notFound("Utilisateur introuvable");

    const body = await req.json();
    const { name, email, password, role, isActive } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) {
      // Vérifier l'unicité si email change
      if (email !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return badRequest("Un utilisateur avec cet email existe déjà");
      }
      data.email = email;
    }
    if (password) {
      if (password.length < 6) return badRequest("Le mot de passe doit contenir au moins 6 caractères");
      data.password = await bcrypt.hash(password, 12);
    }
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.user.update({
      where: { id: params.userId },
      data,
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
      action: "UPDATE",
      entity: "USER",
      entityId: params.userId,
      entityLabel: updated.name || user.name,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverError(error);
  }
}
