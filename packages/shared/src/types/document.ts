import { DocumentType, SignatureStatus } from "../enums";

export interface DocumentDto {
  id: string;
  name: string;
  type: DocumentType;
  filePath: string;
  mimeType: string | null;
  fileSize: number | null;
  signatureStatus: SignatureStatus;
  assetId: string | null;
  personId: string | null;
  companyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentDto {
  name: string;
  assetId?: string;
  personId?: string;
  companyId?: string;
}
