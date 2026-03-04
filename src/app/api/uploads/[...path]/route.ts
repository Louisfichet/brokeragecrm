import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getSession, unauthorized } from "@/lib/api-helpers";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const filePath = path.join(
      process.cwd(),
      "uploads",
      ...params.path
    );

    // Sécurité: vérifier que le chemin ne sort pas du dossier uploads
    const resolved = path.resolve(filePath);
    const uploadsDir = path.resolve(path.join(process.cwd(), "uploads"));
    if (!resolved.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
