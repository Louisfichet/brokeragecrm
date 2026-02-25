// ============================================
// Constantes par défaut — Valeurs de seed
// ============================================

export const DEFAULT_PIPELINE_STATUSES = [
  { name: "Prospection", description: "Bien repéré, pas encore contacté", color: "#6b7280", order: 1 },
  { name: "1er contact pris", description: "Premier échange avec le propriétaire ou l'intermédiaire", color: "#3b82f6", order: 2 },
  { name: "En attente des pièces", description: "Documents demandés : bilan, titre de propriété, charges...", color: "#f59e0b", order: 3 },
  { name: "Analyse en cours", description: "Étude financière et due diligence interne", color: "#8b5cf6", order: 4 },
  { name: "Envoyé à un partenaire", description: "Dossier transmis à un acheteur ou foncière", color: "#06b6d4", order: 5 },
  { name: "En négociation", description: "Offre en cours de discussion entre les parties", color: "#f97316", order: 6 },
  { name: "Accepté / Offre signée", description: "Transaction validée", color: "#22c55e", order: 7 },
  { name: "Refusé / Archivé", description: "Dossier clôturé, bien non retenu", color: "#ef4444", order: 8 },
  { name: "En stand-by", description: "Dossier suspendu temporairement, à relancer", color: "#9ca3af", order: 9 },
] as const;

export const DEFAULT_ASSET_TYPES = [
  { name: "Local commercial", order: 1 },
  { name: "IDR (Immeuble De Rapport)", order: 2 },
  { name: "Bureaux", order: 3 },
  { name: "Hôtel", order: 4 },
  { name: "Médical", order: 5 },
  { name: "Résidentiel", order: 6 },
  { name: "Foncier", order: 7 },
] as const;

export const DEFAULT_ACTION_TYPES = [
  { name: "Appel téléphonique", icon: "phone", order: 1 },
  { name: "Email envoyé", icon: "mail", order: 2 },
  { name: "Visite du bien", icon: "map-pin", order: 3 },
  { name: "Document reçu", icon: "file", order: 4 },
  { name: "Offre envoyée", icon: "send", order: 5 },
  { name: "Réunion / RDV", icon: "calendar", order: 6 },
  { name: "Relance", icon: "refresh-cw", order: 7 },
] as const;

export const DEFAULT_PERSON_TYPES = [
  { name: "Propriétaire", order: 1 },
  { name: "Intermédiaire / Apporteur d'affaire", order: 2 },
  { name: "Acheteur privé", order: 3 },
  { name: "Foncière / Institutionnel", order: 4 },
  { name: "Notaire / Avocat", order: 5 },
  { name: "Locataire en place", order: 6 },
] as const;

// Labels d'affichage pour les enums
export const PERSON_TYPE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  INTERMEDIARY: "Intermédiaire / Apporteur d'affaire",
  PRIVATE_BUYER: "Acheteur privé",
  INSTITUTIONAL: "Foncière / Institutionnel",
  NOTARY: "Notaire / Avocat",
  TENANT: "Locataire en place",
};

export const COMPANY_TYPE_LABELS: Record<string, string> = {
  FONCIERE: "Foncière",
  AGENCY: "Agence immobilière",
  CABINET: "Cabinet (notaire, avocat...)",
  OTHER: "Autre",
};

export const OCCUPATION_LABELS: Record<string, string> = {
  FULLY_RENTED: "Loué entièrement",
  PARTIALLY_RENTED: "Partiellement loué",
  VACANT: "Vide",
};

export const BAIL_TYPE_LABELS: Record<string, string> = {
  COMMERCIAL: "Bail commercial",
  RESIDENTIAL: "Bail d'habitation",
  BAIL_369: "Bail 3/6/9",
  PROFESSIONAL: "Bail professionnel",
  OTHER: "Autre",
};

export const CONDITION_LABELS: Record<string, string> = {
  NO_WORK: "Aucuns travaux",
  LIGHT_WORK: "Travaux légers",
  HEAVY_WORK: "Gros travaux",
};

export const URGENCY_LABELS: Record<string, string> = {
  HIGH: "Haute",
  MEDIUM: "Moyenne",
  LOW: "Basse",
};

export const RELATION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  DORMANT: "Endormi",
  BLACKLISTED: "Blacklisté",
};

export const SIGNATURE_STATUS_LABELS: Record<string, string> = {
  NONE: "Non applicable",
  PENDING: "En attente",
  SENT: "Envoyé",
  VIEWED: "Vu",
  SIGNED: "Signé",
  COMPLETED: "Complété",
};

export const MATCHING_STATUS_LABELS: Record<string, string> = {
  SUGGESTED: "Suggestion",
  VALIDATED: "Validé",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
};
