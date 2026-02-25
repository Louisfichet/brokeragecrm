import { MatchingStatus } from "../enums";

export interface MatchingDto {
  id: string;
  score: number;
  status: MatchingStatus;
  asset: { id: string; reference: string; city: string | null; askingPrice: number | null };
  person: { id: string; firstName: string; lastName: string } | null;
  company: { id: string; name: string } | null;
  matchDetails: Record<string, boolean> | null;
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export interface ValidateMatchingDto {
  matchingIds: string[];
}
