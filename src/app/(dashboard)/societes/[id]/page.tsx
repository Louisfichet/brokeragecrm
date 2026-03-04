"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Globe,
  Pencil,
  Trash2,
  Plus,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  EyeOff,
  Eye,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import NotesSection from "@/components/shared/NotesSection";
import DocumentsSection from "@/components/shared/DocumentsSection";
import CreateContactModal from "@/components/contacts/CreateContactModal";

const TYPE_LABELS: Record<string, string> = {
  APPORTEUR: "Apporteur",
  ACHETEUR: "Acheteur",
  PROPRIETAIRE: "Propriétaire",
};
const TYPE_COLORS: Record<string, "blue" | "green" | "orange"> = {
  APPORTEUR: "orange",
  ACHETEUR: "blue",
  PROPRIETAIRE: "green",
};

interface CompanyData {
  id: string;
  name: string;
  isHidden: boolean;
  website: string | null;
  description: string | null;
  formeJuridique: string | null;
  capitalSocial: string | null;
  siret: string | null;
  villeRCS: string | null;
  adresseSiege: string | null;
  representantCivilite: string | null;
  representantPrenom: string | null;
  representantNom: string | null;
  representantQualite: string | null;
  types: { type: string }[];
  contacts: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
  }[];
  notes: { id: string; title: string; content: string; createdAt: string }[];
  documents: {
    id: string;
    title: string;
    note: string | null;
    fileName: string;
    filePath: string;
    mimeType: string | null;
    size: number | null;
    createdAt: string;
  }[];
  specs: {
    id: string;
    budgetMin: number | null;
    budgetMax: number | null;
    propertyTypes: string[];
    locations: string[];
    minYield: number | null;
    freeText: string | null;
    criteria: { id: string; label: string; value: string }[];
  }[];
  propertiesApported: {
    id: string;
    reference: string;
    address: string;
    city: string | null;
  }[];
  proposalsReceived: {
    id: string;
    status: string;
    property: { id: string; reference: string; address: string; city: string | null };
  }[];
}

const COMPANY_TYPES = [
  { value: "APPORTEUR", label: "Apporteur" },
  { value: "ACHETEUR", label: "Acheteur" },
  { value: "PROPRIETAIRE", label: "Propriétaire" },
];

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const companyId = params.id as string;
  const admin = session?.user?.role === "ADMIN";

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    website: "",
    description: "",
    types: [] as string[],
    formeJuridique: "",
    capitalSocial: "",
    siret: "",
    villeRCS: "",
    adresseSiege: "",
    representantCivilite: "",
    representantPrenom: "",
    representantNom: "",
    representantQualite: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  const fetchCompany = useCallback(async () => {
    try {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) {
        router.push("/societes");
        return;
      }
      const data = await res.json();
      setCompany(data);
    } catch {
      router.push("/societes");
    } finally {
      setLoading(false);
    }
  }, [companyId, router]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const openEdit = () => {
    if (!company) return;
    setEditForm({
      name: company.name,
      website: company.website || "",
      description: company.description || "",
      types: company.types.map((t) => t.type),
      formeJuridique: company.formeJuridique || "",
      capitalSocial: company.capitalSocial || "",
      siret: company.siret || "",
      villeRCS: company.villeRCS || "",
      adresseSiege: company.adresseSiege || "",
      representantCivilite: company.representantCivilite || "",
      representantPrenom: company.representantPrenom || "",
      representantNom: company.representantNom || "",
      representantQualite: company.representantQualite || "",
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await fetch(`/api/companies/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setShowEditModal(false);
      fetchCompany();
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette société et toutes ses données ?")) return;
    try {
      await fetch(`/api/companies/${companyId}`, { method: "DELETE" });
      router.push("/societes");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleVisibility = async () => {
    if (!company) return;
    await fetch(`/api/companies/${companyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHidden: !company.isHidden }),
    });
    fetchCompany();
  };

  const toggleEditType = (type: string) => {
    setEditForm((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!company) return null;

  const isAcheteur = company.types.some((t) => t.type === "ACHETEUR");

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/societes"
        className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Sociétés & Contacts
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-navy-900">
                {company.name}
              </h1>
              {company.types.map((t) => (
                <Badge
                  key={t.type}
                  variant={TYPE_COLORS[t.type] || "gray"}
                  size="md"
                >
                  {TYPE_LABELS[t.type] || t.type}
                </Badge>
              ))}
              {company.isHidden && (
                <Badge variant="red" size="md">
                  Caché
                </Badge>
              )}
            </div>
            {company.website && (
              <a
                href={
                  company.website.startsWith("http")
                    ? company.website
                    : `https://${company.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 mt-2"
              >
                <Globe className="w-3.5 h-3.5" /> {company.website}
              </a>
            )}
            {company.description && (
              <p className="text-sm text-navy-600 mt-2">
                {company.description}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="secondary" onClick={openEdit}>
              <Pencil className="w-4 h-4" /> Modifier
            </Button>
            {admin && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleVisibility}
                  title={company.isHidden ? "Rendre visible" : "Cacher aux freelances"}
                >
                  {company.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="danger" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Informations juridiques */}
      {(company.formeJuridique || company.siret || company.adresseSiege || company.representantNom) && (
        <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
          <div className="px-5 py-4 border-b border-navy-100">
            <h3 className="font-semibold text-navy-900">Informations juridiques</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {company.formeJuridique && (
              <div>
                <p className="text-navy-500 text-xs font-medium uppercase">Forme juridique</p>
                <p className="text-navy-900">{company.formeJuridique}</p>
              </div>
            )}
            {company.capitalSocial && (
              <div>
                <p className="text-navy-500 text-xs font-medium uppercase">Capital social</p>
                <p className="text-navy-900">{company.capitalSocial} &euro;</p>
              </div>
            )}
            {company.siret && (
              <div>
                <p className="text-navy-500 text-xs font-medium uppercase">SIRET / RCS</p>
                <p className="text-navy-900">{company.siret}</p>
              </div>
            )}
            {company.villeRCS && (
              <div>
                <p className="text-navy-500 text-xs font-medium uppercase">Ville RCS</p>
                <p className="text-navy-900">{company.villeRCS}</p>
              </div>
            )}
            {company.adresseSiege && (
              <div className="sm:col-span-2">
                <p className="text-navy-500 text-xs font-medium uppercase">Adresse du siège</p>
                <p className="text-navy-900">{company.adresseSiege}</p>
              </div>
            )}
            {company.representantNom && (
              <div className="sm:col-span-2">
                <p className="text-navy-500 text-xs font-medium uppercase">Représentant légal</p>
                <p className="text-navy-900">
                  {company.representantCivilite} {company.representantPrenom} {company.representantNom}
                  {company.representantQualite ? ` — ${company.representantQualite}` : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contacts associés */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
          <h3 className="font-semibold text-navy-900">
            Contacts ({company.contacts.length})
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowContactModal(true)}
          >
            <UserPlus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
        {company.contacts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-navy-500">
            Aucun contact rattaché
          </div>
        ) : (
          <div className="divide-y divide-navy-50">
            {company.contacts.map((contact) => (
              <div
                key={contact.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-navy-900 text-sm">
                    {contact.firstName} {contact.lastName || ""}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    {contact.email && (
                      <span className="inline-flex items-center gap-1 text-xs text-navy-500">
                        <Mail className="w-3 h-3" /> {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="inline-flex items-center gap-1 text-xs text-navy-500">
                        <Phone className="w-3 h-3" /> {contact.phone}
                      </span>
                    )}
                    {contact.role && (
                      <span className="inline-flex items-center gap-1 text-xs text-navy-500">
                        <Briefcase className="w-3 h-3" /> {contact.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cahier des charges (acheteur uniquement) */}
      {isAcheteur && (
        <CahierDesChargesSection
          companyId={companyId}
          specs={company.specs}
          onRefresh={fetchCompany}
        />
      )}

      {/* Notes */}
      <NotesSection
        notes={company.notes}
        apiBase={`/api/companies/${companyId}/notes`}
        isAdmin={admin}
        onRefresh={fetchCompany}
      />

      {/* Documents */}
      <DocumentsSection
        documents={company.documents}
        apiBase={`/api/companies/${companyId}/documents`}
        isAdmin={admin}
        onRefresh={fetchCompany}
      />

      {/* Biens apportés */}
      {company.propertiesApported.length > 0 && (
        <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
          <div className="px-5 py-4 border-b border-navy-100">
            <h3 className="font-semibold text-navy-900">
              Biens apportés ({company.propertiesApported.length})
            </h3>
          </div>
          <div className="divide-y divide-navy-50">
            {company.propertiesApported.map((prop) => (
              <Link
                key={prop.id}
                href={`/biens/${prop.id}`}
                className="block px-5 py-3 hover:bg-navy-50/50 transition-colors"
              >
                <span className="font-medium text-primary-600 text-sm">
                  {prop.reference}
                </span>
                <span className="text-sm text-navy-600 ml-2">
                  {prop.address}
                  {prop.city ? `, ${prop.city}` : ""}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Biens proposés */}
      {company.proposalsReceived.length > 0 && (
        <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
          <div className="px-5 py-4 border-b border-navy-100">
            <h3 className="font-semibold text-navy-900">
              Biens proposés ({company.proposalsReceived.length})
            </h3>
          </div>
          <div className="divide-y divide-navy-50">
            {company.proposalsReceived.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/biens/${proposal.property.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-navy-50/50 transition-colors"
              >
                <div>
                  <span className="font-medium text-primary-600 text-sm">
                    {proposal.property.reference}
                  </span>
                  <span className="text-sm text-navy-600 ml-2">
                    {proposal.property.address}
                    {proposal.property.city ? `, ${proposal.property.city}` : ""}
                  </span>
                </div>
                <Badge
                  variant={proposal.status === "ACTIF" ? "green" : "red"}
                  size="sm"
                >
                  {proposal.status === "ACTIF" ? "Actif" : "Refusé"}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier la société"
        size="lg"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Nom *"
            value={editForm.name}
            onChange={(e) =>
              setEditForm({ ...editForm, name: e.target.value })
            }
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-navy-700">
              Type(s) *
            </label>
            <div className="flex flex-wrap gap-2">
              {COMPANY_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleEditType(type.value)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                    editForm.types.includes(type.value)
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-white border-navy-200 text-navy-600 hover:bg-navy-50"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Site web"
            value={editForm.website}
            onChange={(e) =>
              setEditForm({ ...editForm, website: e.target.value })
            }
          />
          <Textarea
            label="Description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
          />

          {/* Informations juridiques */}
          <div className="border-t border-navy-100 pt-4 mt-2">
            <p className="text-sm font-semibold text-navy-700 mb-3">Informations juridiques</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Forme juridique"
                  value={editForm.formeJuridique}
                  onChange={(e) => setEditForm({ ...editForm, formeJuridique: e.target.value })}
                  placeholder="SAS, SARL, SCI..."
                />
                <Input
                  label="Capital social (€)"
                  value={editForm.capitalSocial}
                  onChange={(e) => setEditForm({ ...editForm, capitalSocial: e.target.value })}
                  placeholder="10 000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="SIRET / RCS"
                  value={editForm.siret}
                  onChange={(e) => setEditForm({ ...editForm, siret: e.target.value })}
                  placeholder="123 456 789 00012"
                />
                <Input
                  label="Ville RCS"
                  value={editForm.villeRCS}
                  onChange={(e) => setEditForm({ ...editForm, villeRCS: e.target.value })}
                  placeholder="Paris"
                />
              </div>
              <Input
                label="Adresse du siège"
                value={editForm.adresseSiege}
                onChange={(e) => setEditForm({ ...editForm, adresseSiege: e.target.value })}
                placeholder="1 rue de la Paix, 75001 Paris"
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Civilité"
                  value={editForm.representantCivilite}
                  onChange={(e) => setEditForm({ ...editForm, representantCivilite: e.target.value })}
                  placeholder="M. / Mme"
                />
                <Input
                  label="Prénom représentant"
                  value={editForm.representantPrenom}
                  onChange={(e) => setEditForm({ ...editForm, representantPrenom: e.target.value })}
                />
                <Input
                  label="Nom représentant"
                  value={editForm.representantNom}
                  onChange={(e) => setEditForm({ ...editForm, representantNom: e.target.value })}
                />
              </div>
              <Input
                label="Qualité du représentant"
                value={editForm.representantQualite}
                onChange={(e) => setEditForm({ ...editForm, representantQualite: e.target.value })}
                placeholder="Gérant, Président..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowEditModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={editLoading}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      <CreateContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        companyId={companyId}
        onCreated={fetchCompany}
      />
    </div>
  );
}

// Composant cahier des charges inline
function CahierDesChargesSection({
  companyId,
  specs,
  onRefresh,
}: {
  companyId: string;
  specs: CompanyData["specs"];
  onRefresh: () => void;
}) {
  const spec = specs[0]; // Une seule spec par société pour l'instant
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    budgetMin: spec?.budgetMin?.toString() || "",
    budgetMax: spec?.budgetMax?.toString() || "",
    propertyTypes: spec?.propertyTypes?.join(", ") || "",
    locations: spec?.locations?.join(", ") || "",
    minYield: spec?.minYield?.toString() || "",
    freeText: spec?.freeText || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = spec
        ? `/api/companies/${companyId}/specs/${spec.id}`
        : `/api/companies/${companyId}/specs`;

      await fetch(url, {
        method: spec ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : null,
          budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : null,
          propertyTypes: form.propertyTypes
            ? form.propertyTypes.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          locations: form.locations
            ? form.locations.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          minYield: form.minYield ? parseFloat(form.minYield) : null,
          freeText: form.freeText || null,
        }),
      });
      setShowModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
        <h3 className="font-semibold text-navy-900">Cahier des charges</h3>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowModal(true)}
        >
          <Pencil className="w-4 h-4" /> {spec ? "Modifier" : "Définir"}
        </Button>
      </div>

      {!spec ? (
        <div className="px-5 py-8 text-center text-sm text-navy-500">
          Aucun cahier des charges défini
        </div>
      ) : (
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {(spec.budgetMin || spec.budgetMax) && (
              <div>
                <p className="text-navy-500 text-xs font-medium uppercase">
                  Budget
                </p>
                <p className="text-navy-900">
                  {spec.budgetMin
                    ? `${spec.budgetMin.toLocaleString("fr-FR")} €`
                    : "—"}{" "}
                  →{" "}
                  {spec.budgetMax
                    ? `${spec.budgetMax.toLocaleString("fr-FR")} €`
                    : "—"}
                </p>
              </div>
            )}
            {spec.minYield && (
              <div>
                <p className="text-navy-500 text-xs font-medium uppercase">
                  Rendement min.
                </p>
                <p className="text-navy-900">{spec.minYield}%</p>
              </div>
            )}
            {spec.propertyTypes.length > 0 && (
              <div>
                <p className="text-navy-500 text-xs font-medium uppercase">
                  Types de bien
                </p>
                <p className="text-navy-900">{spec.propertyTypes.join(", ")}</p>
              </div>
            )}
            {spec.locations.length > 0 && (
              <div>
                <p className="text-navy-500 text-xs font-medium uppercase">
                  Localisations
                </p>
                <p className="text-navy-900">{spec.locations.join(", ")}</p>
              </div>
            )}
          </div>
          {spec.freeText && (
            <div className="pt-2 border-t border-navy-100">
              <p className="text-navy-500 text-xs font-medium uppercase mb-1">
                Notes
              </p>
              <p className="text-sm text-navy-700 whitespace-pre-wrap">
                {spec.freeText}
              </p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Cahier des charges"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Budget min (€)"
              type="number"
              value={form.budgetMin}
              onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
              placeholder="100 000"
            />
            <Input
              label="Budget max (€)"
              type="number"
              value={form.budgetMax}
              onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
              placeholder="500 000"
            />
          </div>
          <Input
            label="Types de bien recherchés"
            value={form.propertyTypes}
            onChange={(e) =>
              setForm({ ...form, propertyTypes: e.target.value })
            }
            placeholder="Local commercial, immeuble, appartement..."
          />
          <Input
            label="Localisations souhaitées"
            value={form.locations}
            onChange={(e) => setForm({ ...form, locations: e.target.value })}
            placeholder="Paris, Lyon, Bordeaux..."
          />
          <Input
            label="Rendement minimum (%)"
            type="number"
            step="0.1"
            value={form.minYield}
            onChange={(e) => setForm({ ...form, minYield: e.target.value })}
            placeholder="6.5"
          />
          <Textarea
            label="Notes libres"
            value={form.freeText}
            onChange={(e) => setForm({ ...form, freeText: e.target.value })}
            placeholder="Précisions non structurées..."
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
