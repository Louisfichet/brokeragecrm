import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PersonsService {
  constructor(private prisma: PrismaService) {}
}
