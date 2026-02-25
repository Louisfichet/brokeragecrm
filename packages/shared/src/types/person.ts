import { PersonType, RelationStatus } from "../enums";

export interface PersonDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  phone2: string | null;
  position: string | null;
  type: PersonType;
  relationStatus: RelationStatus;
  source: string | null;
  notes: string | null;
  company: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  phone2?: string;
  position?: string;
  type?: PersonType;
  companyId?: string;
  relationStatus?: RelationStatus;
  source?: string;
  notes?: string;
}

export interface UpdatePersonDto extends Partial<CreatePersonDto> {}
