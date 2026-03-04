import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, serverError } from "@/lib/api-helpers";

// GET /api/characteristic-labels — Catalogue global des labels
export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const labels = await prisma.characteristicLabel.findMany({
      orderBy: { label: "asc" },
    });
    return NextResponse.json(labels);
  } catch (error) {
    return serverError(error);
  }
}
