import { Controller, UseGuards } from "@nestjs/common";
import { DocumentsService } from "./documents.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}
}
