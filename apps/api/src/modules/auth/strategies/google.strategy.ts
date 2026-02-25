import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || "not-configured",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "not-configured",
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3001/api/auth/google/callback",
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: Array<{ value: string }>;
      name?: { givenName?: string; familyName?: string };
      photos?: Array<{ value: string }>;
    },
    done: VerifyCallback,
  ) {
    const result = await this.authService.validateGoogleUser({
      googleId: profile.id,
      email: profile.emails?.[0]?.value || "",
      firstName: profile.name?.givenName || "",
      lastName: profile.name?.familyName || "",
      avatarUrl: profile.photos?.[0]?.value,
    });

    done(null, result);
  }
}
