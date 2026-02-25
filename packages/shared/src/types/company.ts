import {
  CompanyType,
  RelationStatus,
  OccupationType,
  PropertyCondition,
  BailType,
} from "../enums";

export interface BuyerCriteriaDto {
  id: string;
  assetTypes: string[];
  zones: string[];
  maxDistanceParis: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  minYield: number | null;
  occupation: OccupationType | null;
  condition: PropertyCondition | null;
  bailType: BailType | null;
}

export interface CompanyDto {
  id: string;
  name: string;
  type: CompanyType;
  sector: string | null;
  address: string | null;
  website: string | null;
  relationStatus: RelationStatus;
  source: string | null;
  notes: string | null;
  buyerCriteria: BuyerCriteriaDto | null;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDto {
  name: string;
  type?: CompanyType;
  sector?: string;
  address?: string;
  website?: string;
  relationStatus?: RelationStatus;
  source?: string;
  notes?: string;
}

export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {}

export interface CreateBuyerCriteriaDto {
  assetTypes?: string[];
  zones?: string[];
  maxDistanceParis?: number;
  budgetMin?: number;
  budgetMax?: number;
  minYield?: number;
  occupation?: OccupationType;
  condition?: PropertyCondition;
  bailType?: BailType;
}
