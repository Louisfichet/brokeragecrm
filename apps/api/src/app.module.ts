import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { AssetsModule } from "./modules/assets/assets.module";
import { PersonsModule } from "./modules/persons/persons.module";
import { CompaniesModule } from "./modules/companies/companies.module";
import { JournalModule } from "./modules/journal/journal.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { MatchingModule } from "./modules/matching/matching.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { EmailsModule } from "./modules/emails/emails.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { EventsGateway } from "./websockets/events.gateway";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AssetsModule,
    PersonsModule,
    CompaniesModule,
    JournalModule,
    DocumentsModule,
    MatchingModule,
    NotificationsModule,
    EmailsModule,
    SettingsModule,
  ],
  providers: [EventsGateway],
})
export class AppModule {}
