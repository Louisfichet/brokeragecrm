import {
  DPE,
  OccupationType,
  PropertyCondition,
  BailType,
  UrgencyLevel,
} from "../enums";

export interface AssetDto {
  id: string;
  reference: string;
  status: { id: string; name: string; color: string } | null;
  assetType: { id: string; name: string } | null;
  source: string | null;
  sourceUrl: string | null;
  discoveredAt: string | null;
  firstContactAt: string | null;

  // Localisation
  address: string | null;
  zipCode: string | null;
  city: string | null;
  department: string | null;

  // Caractéristiques
  surface: number | null;
  nbUnits: number | null;
  dpe: DPE | null;
  generalCondition: PropertyCondition | null;

  // Financier
  askingPrice: number | null;
  pricePerSqm: number | null;
  yieldAEM: number | null;
  currentRentHCHT: number | null;

  // Locatif
  occupation: OccupationType | null;
  bailType: BailType | null;
  saleUrgency: UrgencyLevel | null;

  // Méta
  createdBy: { id: string; firstName: string; lastName: string } | null;
  assignedTo: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetDto {
  statusId?: string;
  assetTypeId?: string;
  source?: string;
  sourceUrl?: string;
  discoveredAt?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  department?: string;
  surface?: number;
  askingPrice?: number;
  assignedToId?: string;
}

export interface UpdateAssetDto extends Partial<CreateAssetDto> {
  firstContactAt?: string;
  latitude?: number;
  longitude?: number;
  distanceFromParis?: number;
  travelTimeFromParis?: number;
  nbUnits?: number;
  floor?: string;
  hasExterior?: boolean;
  exteriorDetails?: string;
  hasElevator?: boolean;
  hasCellar?: boolean;
  hasGarage?: boolean;
  hasParking?: boolean;
  generalCondition?: PropertyCondition;
  workDescription?: string;
  estimatedWorkCost?: number;
  dpe?: DPE;
  pricePerSqm?: number;
  yieldAEM?: number;
  proposalAEM?: number;
  annualCharges?: number;
  propertyTax?: number;
  currentRentHCHT?: number;
  potentialRentHCHT?: number;
  rentalIncomeHCHT?: number;
  occupation?: OccupationType;
  bailType?: BailType;
  bailEndDate?: string;
  hasTenantInPlace?: boolean;
  saleUrgency?: UrgencyLevel;
  ownerMotivation?: string;
  customFields?: Record<string, unknown>;
}
