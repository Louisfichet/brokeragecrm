import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}
}
