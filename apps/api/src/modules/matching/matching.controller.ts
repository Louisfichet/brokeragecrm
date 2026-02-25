import { Controller, UseGuards } from "@nestjs/common";
import { MatchingService } from "./matching.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("matching")
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private matchingService: MatchingService) {}
}
