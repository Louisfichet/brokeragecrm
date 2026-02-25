import { Controller, UseGuards } from "@nestjs/common";
import { PersonsService } from "./persons.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("persons")
@UseGuards(JwtAuthGuard)
export class PersonsController {
  constructor(private personsService: PersonsService) {}
}
