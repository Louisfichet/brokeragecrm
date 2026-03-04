"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Shield,
  Handshake,
  Save,
  X,
  Check,
  Building2,
  User,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CrmSearch from "./CrmSearch";
import PropertySearch from "./PropertySearch";

// Types
interface CrmEntity {
  id: string;
  type: "company" | "contact";
  name: string;
  subtitle?: string;
  email?: string;
}

interface PropertyResult {
  id: string;
  reference: string;
  address: string;
  city: string | null;
  priceFAI: number | null;
}

type DocumentType = "NDA_TYPE1" | "NDA_TYPE2" | "INTERCAB";

interface WizardFormData {
  // Step 1
  documentType: DocumentType | null;
  // Step 2
  counterparty: CrmEntity | null;
  linkedProperty: boolean;
  property: PropertyResult | null;
  affiliatedCompany: CrmEntity | null;
  documentDate: string;
  // Champs juridiques contrepartie
  counterpartyRaisonSociale: string;
  counterpartyFormeJuridique: string;
  counterpartyCapital: string;
  counterpartySiret: string;
  counterpartyVilleRCS: string;
  counterpartyAdresse: string;
  counterpartyRepresentant: string;
  counterpartyQualite: string;
  counterpartyCivilite: string;
  counterpartyPrenom: string;
  counterpartyNom: string;
  counterpartyAdressePersonne: string;
  // Step 3 — NDA
  tauxCommission: string;
  montantCommission: string;
  // Step 3 — NDA prix
  prixBienFaiNv: "FAI" | "NV";
}

const initialFormData: WizardFormData = {
  documentType: null,
  counterparty: null,
  linkedProperty: false,
  property: null,
  affiliatedCompany: null,
  documentDate: new Date().toISOString().split("T")[0],
  counterpartyRaisonSociale: "",
  counterpartyFormeJuridique: "",
  counterpartyCapital: "",
  counterpartySiret: "",
  counterpartyVilleRCS: "",
  counterpartyAdresse: "",
  counterpartyRepresentant: "",
  counterpartyQualite: "",
  counterpartyCivilite: "",
  counterpartyPrenom: "",
  counterpartyNom: "",
  counterpartyAdressePersonne: "",
  tauxCommission: "",
  montantCommission: "",
  prixBienFaiNv: "FAI",
};

const DOC_TYPES: {
  type: DocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "NDA_TYPE1",
    label: "NDA — Parkto divulgue",
    description: "Parkto présente un bien à un acheteur/investisseur",
    icon: <Shield className="w-6 h-6" />,
  },
  {
    type: "NDA_TYPE2",
    label: "NDA — L'autre partie divulgue",
    description: "Un partenaire présente un bien confidentiel à Parkto",
    icon: <Shield className="w-6 h-6" />,
  },
  {
    type: "INTERCAB",
    label: "Intercab",
    description: "Protocole de collaboration et partage d'honoraires",
    icon: <Handshake className="w-6 h-6" />,
  },
];


interface DocumentWizardProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function DocumentWizard({
  onClose,
  onCreated,
}: DocumentWizardProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalSteps = 4;

  const updateForm = (updates: Partial<WizardFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  // Pré-remplir les champs juridiques quand on sélectionne une contrepartie
  const fetchCounterpartyDetails = async (entity: CrmEntity) => {
    try {
      if (entity.type === "company") {
        const res = await fetch(`/api/companies/${entity.id}`);
        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            counterpartyRaisonSociale: data.name || "",
            counterpartyFormeJuridique: data.formeJuridique || "",
            counterpartyCapital: data.capitalSocial || "",
            counterpartySiret: data.siret || "",
            counterpartyVilleRCS: data.villeRCS || "",
            counterpartyAdresse: data.adresseSiege || "",
            counterpartyRepresentant:
              data.representantPrenom && data.representantNom
                ? `${data.representantCivilite || ""} ${data.representantPrenom} ${data.representantNom}`.trim()
                : "",
            counterpartyQualite: data.representantQualite || "",
          }));
        }
      } else {
        const res = await fetch(`/api/contacts/${entity.id}`);
        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            counterpartyCivilite: data.civilite || "",
            counterpartyPrenom: data.firstName || "",
            counterpartyNom: data.lastName || "",
            counterpartyAdressePersonne: data.adresse || "",
          }));
        }
      }
    } catch {
      // Silently fail — user can fill manually
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return form.documentType !== null;
      case 2:
        return form.counterparty !== null;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError("");

    try {
      const companyId =
        form.affiliatedCompany?.type === "company"
          ? form.affiliatedCompany.id
          : form.counterparty?.type === "company"
          ? form.counterparty.id
          : null;

      const contactId =
        form.counterparty?.type === "contact"
          ? form.counterparty.id
          : null;

      if (!companyId && !contactId) {
        setError("Une contrepartie est requise");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.documentType,
          companyId,
          contactId,
          propertyId: form.linkedProperty ? form.property?.id : null,
          counterpartyName: form.counterparty?.name || "",
          formData: form,
        }),
      });

      if (res.ok) {
        onCreated();
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">
              Nouveau document
            </h2>
            <p className="text-sm text-navy-500">
              Étape {step} sur {totalSteps}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-navy-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-primary-500" : "bg-navy-100"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 1 && <Step1 form={form} updateForm={updateForm} />}
          {step === 2 && (
            <Step2
              form={form}
              updateForm={updateForm}
              onCounterpartySelect={fetchCounterpartyDetails}
            />
          )}
          {step === 3 && <Step3 form={form} updateForm={updateForm} />}
          {step === 4 && <Step4 form={form} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-navy-100">
          <Button
            variant="ghost"
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? "Annuler" : "Retour"}
          </Button>

          <div className="flex gap-2">
            {step === totalSteps ? (
              <Button onClick={handleSaveDraft} loading={saving}>
                <Save className="w-4 h-4" />
                Sauvegarder le brouillon
              </Button>
            ) : (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STEP 1 — Choix du type de document
// ============================================

function Step1({
  form,
  updateForm,
}: {
  form: WizardFormData;
  updateForm: (u: Partial<WizardFormData>) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-navy-900 mb-1">
        Quel document souhaitez-vous créer ?
      </h3>
      <p className="text-sm text-navy-500 mb-6">
        Sélectionnez le type de document à générer
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DOC_TYPES.map((doc) => (
          <button
            key={doc.type}
            onClick={() => updateForm({ documentType: doc.type })}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
              form.documentType === doc.type
                ? "border-primary-500 bg-primary-50/50 shadow-sm"
                : "border-navy-100 hover:border-navy-200 hover:bg-navy-50/50"
            }`}
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                form.documentType === doc.type
                  ? "bg-primary-100 text-primary-600"
                  : "bg-navy-50 text-navy-400"
              }`}
            >
              {doc.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-900">
                {doc.label}
              </p>
              <p className="text-xs text-navy-500 mt-0.5">{doc.description}</p>
            </div>
            {form.documentType === doc.type && (
              <Check className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// STEP 2 — Informations communes
// ============================================

function Step2({
  form,
  updateForm,
  onCounterpartySelect,
}: {
  form: WizardFormData;
  updateForm: (u: Partial<WizardFormData>) => void;
  onCounterpartySelect: (entity: CrmEntity) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-navy-900 mb-1">
          Informations générales
        </h3>
        <p className="text-sm text-navy-500 mb-6">
          Sélectionnez la contrepartie et les informations de base
        </p>
      </div>

      <CrmSearch
        label="Contrepartie"
        placeholder="Rechercher une société ou un contact..."
        value={form.counterparty}
        onChange={(entity) => {
          updateForm({ counterparty: entity });
          if (entity) {
            onCounterpartySelect(entity);
            if (entity.type === "company" && !form.affiliatedCompany) {
              updateForm({
                counterparty: entity,
                affiliatedCompany: entity,
              });
            }
          }
        }}
      />

      {/* Société affiliée — uniquement si la contrepartie est un contact */}
      {form.counterparty?.type === "contact" && (
        <CrmSearch
          label="Société affiliée (optionnel — pour le rattachement CRM)"
          placeholder="Rechercher une société..."
          value={form.affiliatedCompany}
          onChange={(entity) => updateForm({ affiliatedCompany: entity })}
          entityTypes={["company"]}
        />
      )}

      {/* Toggle bien lié */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.linkedProperty}
            onChange={(e) =>
              updateForm({
                linkedProperty: e.target.checked,
                property: e.target.checked ? form.property : null,
              })
            }
            className="w-4 h-4 rounded border-navy-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-navy-700">
            Lié à un bien spécifique
          </span>
        </label>

        {form.linkedProperty && (
          <PropertySearch
            label="Bien concerné"
            value={form.property}
            onChange={(property) => updateForm({ property })}
          />
        )}
      </div>

      <Input
        label="Date du document"
        type="date"
        value={form.documentDate}
        onChange={(e) => updateForm({ documentDate: e.target.value })}
      />
    </div>
  );
}

// ============================================
// STEP 3 — Champs spécifiques par type
// ============================================

function Step3({
  form,
  updateForm,
}: {
  form: WizardFormData;
  updateForm: (u: Partial<WizardFormData>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Informations juridiques de la contrepartie */}
      <CounterpartyLegalFields form={form} updateForm={updateForm} />

      {/* Séparateur */}
      <div className="h-px bg-navy-100" />

      {/* Champs spécifiques au type de document */}
      {(form.documentType === "NDA_TYPE1" ||
        form.documentType === "NDA_TYPE2") && (
        <Step3NDA form={form} updateForm={updateForm} />
      )}
      {form.documentType === "INTERCAB" && (
        <div className="bg-navy-50 rounded-xl p-4 text-sm text-navy-600">
          <Handshake className="w-5 h-5 text-navy-400 mb-2" />
          L&apos;intercab est un protocole de co-courtage standard : commission partagée 50/50, mécanisme de double virement notaire en priorité, non-contournement de 2 ans. Seules les informations juridiques ci-dessus sont nécessaires.
        </div>
      )}
    </div>
  );
}

// ============================================
// Champs juridiques de la contrepartie
// ============================================

function CounterpartyLegalFields({
  form,
  updateForm,
}: {
  form: WizardFormData;
  updateForm: (u: Partial<WizardFormData>) => void;
}) {
  const isCompany = form.counterparty?.type === "company";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {isCompany ? (
          <Building2 className="w-4 h-4 text-primary-500" />
        ) : (
          <User className="w-4 h-4 text-primary-500" />
        )}
        <h3 className="text-sm font-semibold text-navy-900">
          Informations juridiques — {form.counterparty?.name || "Contrepartie"}
        </h3>
      </div>
      <p className="text-xs text-navy-500 -mt-2">
        Pré-remplis depuis le CRM si disponible. Complétez ou corrigez si
        nécessaire.
      </p>

      {isCompany ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Raison sociale"
              value={form.counterpartyRaisonSociale}
              onChange={(e) =>
                updateForm({ counterpartyRaisonSociale: e.target.value })
              }
              placeholder="Nom de la société"
            />
            <Input
              label="Forme juridique"
              value={form.counterpartyFormeJuridique}
              onChange={(e) =>
                updateForm({ counterpartyFormeJuridique: e.target.value })
              }
              placeholder="SAS, SARL, SCI..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Capital social (€)"
              value={form.counterpartyCapital}
              onChange={(e) =>
                updateForm({ counterpartyCapital: e.target.value })
              }
              placeholder="10 000"
            />
            <Input
              label="SIRET / RCS"
              value={form.counterpartySiret}
              onChange={(e) =>
                updateForm({ counterpartySiret: e.target.value })
              }
              placeholder="123 456 789"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ville RCS"
              value={form.counterpartyVilleRCS}
              onChange={(e) =>
                updateForm({ counterpartyVilleRCS: e.target.value })
              }
              placeholder="Paris"
            />
            <Input
              label="Adresse siège social"
              value={form.counterpartyAdresse}
              onChange={(e) =>
                updateForm({ counterpartyAdresse: e.target.value })
              }
              placeholder="123 rue de..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Représentant"
              value={form.counterpartyRepresentant}
              onChange={(e) =>
                updateForm({ counterpartyRepresentant: e.target.value })
              }
              placeholder="M. Jean Dupont"
            />
            <Input
              label="Qualité"
              value={form.counterpartyQualite}
              onChange={(e) =>
                updateForm({ counterpartyQualite: e.target.value })
              }
              placeholder="Gérant, Président..."
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Civilité"
              value={form.counterpartyCivilite}
              onChange={(e) =>
                updateForm({ counterpartyCivilite: e.target.value })
              }
              placeholder="M., Mme"
            />
            <Input
              label="Prénom"
              value={form.counterpartyPrenom}
              onChange={(e) =>
                updateForm({ counterpartyPrenom: e.target.value })
              }
            />
            <Input
              label="Nom"
              value={form.counterpartyNom}
              onChange={(e) =>
                updateForm({ counterpartyNom: e.target.value })
              }
            />
          </div>
          <Input
            label="Adresse"
            value={form.counterpartyAdressePersonne}
            onChange={(e) =>
              updateForm({ counterpartyAdressePersonne: e.target.value })
            }
            placeholder="123 rue de..."
          />
        </div>
      )}
    </div>
  );
}

function Step3NDA({
  form,
  updateForm,
}: {
  form: WizardFormData;
  updateForm: (u: Partial<WizardFormData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-navy-900 mb-1">
          Paramètres du NDA
        </h3>
        <p className="text-xs text-navy-500 mb-4">
          {form.documentType === "NDA_TYPE1"
            ? "Parkto divulgue des informations confidentielles"
            : "L'autre partie divulgue des informations à Parkto"}
        </p>
      </div>

      {form.linkedProperty && (
        <>
          <Input
            label="Taux de commission (%)"
            type="text"
            value={form.tauxCommission}
            onChange={(e) => updateForm({ tauxCommission: e.target.value })}
            placeholder="ex: 5"
          />
          <Input
            label="Montant estimé de la commission (€)"
            type="text"
            value={form.montantCommission}
            onChange={(e) => updateForm({ montantCommission: e.target.value })}
            placeholder="ex: 50 000"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-navy-700">
              Prix affiché
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateForm({ prixBienFaiNv: "FAI" })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  form.prixBienFaiNv === "FAI"
                    ? "bg-primary-500 text-white"
                    : "bg-navy-50 text-navy-600 hover:bg-navy-100"
                }`}
              >
                FAI
              </button>
              <button
                onClick={() => updateForm({ prixBienFaiNv: "NV" })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  form.prixBienFaiNv === "NV"
                    ? "bg-primary-500 text-white"
                    : "bg-navy-50 text-navy-600 hover:bg-navy-100"
                }`}
              >
                Net vendeur
              </button>
            </div>
          </div>
        </>
      )}

      {!form.linkedProperty && (
        <div className="bg-navy-50 rounded-xl p-4 text-sm text-navy-600">
          <FileText className="w-5 h-5 text-navy-400 mb-2" />
          Aucun champ supplémentaire requis pour un NDA générique. Les clauses
          de non-contournement utiliseront une formulation standard sans montant
          spécifique.
        </div>
      )}
    </div>
  );
}


// ============================================
// STEP 4 — Récapitulatif
// ============================================

function Step4({ form }: { form: WizardFormData }) {
  const docType = DOC_TYPES.find((d) => d.type === form.documentType);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-navy-900 mb-1">
          Récapitulatif
        </h3>
        <p className="text-sm text-navy-500 mb-6">
          Vérifiez les informations avant de sauvegarder le brouillon
        </p>
      </div>

      <div className="bg-navy-50 rounded-xl p-5 space-y-4">
        <RecapRow label="Type de document" value={docType?.label || ""} />
        <RecapRow
          label="Contrepartie"
          value={form.counterparty?.name || "—"}
        />
        <RecapRow
          label="Type contrepartie"
          value={
            form.counterparty?.type === "company"
              ? "Société"
              : "Personne physique"
          }
        />

        {form.counterparty?.type === "company" &&
          form.counterpartyRaisonSociale && (
            <RecapRow
              label="Société"
              value={`${form.counterpartyRaisonSociale}${form.counterpartySiret ? ` — ${form.counterpartySiret}` : ""}`}
            />
          )}
        {form.counterparty?.type === "contact" && form.counterpartyNom && (
          <RecapRow
            label="Personne"
            value={`${form.counterpartyCivilite} ${form.counterpartyPrenom} ${form.counterpartyNom}`.trim()}
          />
        )}

        {form.affiliatedCompany && (
          <RecapRow
            label="Société affiliée"
            value={form.affiliatedCompany.name}
          />
        )}
        <RecapRow
          label="Bien lié"
          value={
            form.linkedProperty && form.property
              ? `${form.property.reference} — ${form.property.address}`
              : "Non"
          }
        />
        <RecapRow
          label="Date"
          value={new Date(form.documentDate).toLocaleDateString("fr-FR")}
        />

        {(form.documentType === "NDA_TYPE1" ||
          form.documentType === "NDA_TYPE2") &&
          form.linkedProperty && (
            <>
              <div className="h-px bg-navy-200" />
              <RecapRow
                label="Commission"
                value={`${form.tauxCommission}% — ${form.montantCommission} €`}
              />
            </>
          )}

        {form.documentType === "INTERCAB" && (
          <>
            <div className="h-px bg-navy-200" />
            <RecapRow label="Répartition" value="50% / 50% HT" />
            <RecapRow
              label="Versement"
              value="Double virement notaire (priorité) ou reversement sous 15j"
            />
          </>
        )}
      </div>

      <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700">
        Le document sera sauvegardé en tant que <strong>brouillon</strong>. Vous
        pourrez ensuite générer le PDF et l&apos;envoyer pour signature.
      </div>
    </div>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-navy-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-navy-900 text-right">
        {value}
      </span>
    </div>
  );
}
