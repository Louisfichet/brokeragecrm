import { Controller, UseGuards } from "@nestjs/common";
import { EmailsService } from "./emails.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("emails")
@UseGuards(JwtAuthGuard)
export class EmailsController {
  constructor(private emailsService: EmailsService) {}
}
