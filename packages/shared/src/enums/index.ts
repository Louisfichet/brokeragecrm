// ============================================
// Enums partagés — miroir du schema Prisma
// ============================================

export enum UserRole {
  ADMIN = "ADMIN",
  BROKER = "BROKER",
}

export enum PersonType {
  OWNER = "OWNER",
  INTERMEDIARY = "INTERMEDIARY",
  PRIVATE_BUYER = "PRIVATE_BUYER",
  INSTITUTIONAL = "INSTITUTIONAL",
  NOTARY = "NOTARY",
  TENANT = "TENANT",
}

export enum CompanyType {
  FONCIERE = "FONCIERE",
  AGENCY = "AGENCY",
  CABINET = "CABINET",
  OTHER = "OTHER",
}

export enum RelationStatus {
  ACTIVE = "ACTIVE",
  DORMANT = "DORMANT",
  BLACKLISTED = "BLACKLISTED",
}

export enum DocumentType {
  IMAGE = "IMAGE",
  PDF = "PDF",
  WORD = "WORD",
  OTHER = "OTHER",
}

export enum SignatureStatus {
  NONE = "NONE",
  PENDING = "PENDING",
  SENT = "SENT",
  VIEWED = "VIEWED",
  SIGNED = "SIGNED",
  COMPLETED = "COMPLETED",
}

export enum OccupationType {
  FULLY_RENTED = "FULLY_RENTED",
  PARTIALLY_RENTED = "PARTIALLY_RENTED",
  VACANT = "VACANT",
}

export enum PropertyCondition {
  NO_WORK = "NO_WORK",
  LIGHT_WORK = "LIGHT_WORK",
  HEAVY_WORK = "HEAVY_WORK",
}

export enum BailType {
  COMMERCIAL = "COMMERCIAL",
  RESIDENTIAL = "RESIDENTIAL",
  BAIL_369 = "BAIL_369",
  PROFESSIONAL = "PROFESSIONAL",
  OTHER = "OTHER",
}

export enum DPE {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  F = "F",
  G = "G",
}

export enum UrgencyLevel {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum ContactRole {
  OWNER = "OWNER",
  INTERMEDIARY = "INTERMEDIARY",
  BUYER = "BUYER",
  NOTARY = "NOTARY",
  TENANT = "TENANT",
  OTHER = "OTHER",
}

export enum MatchingStatus {
  SUGGESTED = "SUGGESTED",
  VALIDATED = "VALIDATED",
  SENT = "SENT",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export enum EmailDirection {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
}
