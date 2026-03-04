import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface LogParams {
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "GENERATE";
  entity: "COMPANY" | "CONTACT" | "PROPERTY" | "DOCUMENT" | "USER" | "SETTINGS";
  entityId?: string;
  entityLabel: string;
  details?: Prisma.InputJsonValue;
}

export function logActivity(params: LogParams) {
  // Fire-and-forget — ne bloque pas la route API
  prisma.activityLog
    .create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        entityLabel: params.entityLabel,
        details: params.details || undefined,
      },
    })
    .catch((err) => console.error("ActivityLog error:", err));
}
