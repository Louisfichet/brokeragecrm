import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    // Only log mutating operations
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      return next.handle().pipe(
        tap(async () => {
          try {
            await this.prisma.auditLog.create({
              data: {
                action: method,
                entityType: this.extractEntityType(url),
                entityId: this.extractEntityId(url),
                userId: user?.sub || null,
                ipAddress: request.ip,
              },
            });
          } catch {
            // Audit log failure should not break the request
          }
        }),
      );
    }

    return next.handle();
  }

  private extractEntityType(url: string): string {
    const segments = url.split("/").filter(Boolean);
    // /api/assets/123 → "assets"
    return segments[1] || "unknown";
  }

  private extractEntityId(url: string): string | null {
    const segments = url.split("/").filter(Boolean);
    return segments[2] || null;
  }
}
