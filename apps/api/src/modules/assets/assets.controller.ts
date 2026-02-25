import { Controller, UseGuards } from "@nestjs/common";
import { AssetsService } from "./assets.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("assets")
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private assetsService: AssetsService) {}
}
