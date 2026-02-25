import { Controller, UseGuards } from "@nestjs/common";
import { JournalService } from "./journal.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("journal")
@UseGuards(JwtAuthGuard)
export class JournalController {
  constructor(private journalService: JournalService) {}
}
