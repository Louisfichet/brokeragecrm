import { Controller, UseGuards } from "@nestjs/common";
import { CompaniesService } from "./companies.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("companies")
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}
}
