"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Pencil,
  X,
  ImagePlus,
  Camera,
  Download,
  EyeOff,
  Eye,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import EmptyState from "@/components/ui/EmptyState";
import NotesSection from "@/components/shared/NotesSection";
import FileManager from "@/components/shared/FileManager";
import AddressAutocomplete from "@/components/properties/AddressAutocomplete";
import ApporteurSearch from "@/components/properties/ApporteurSearch";

interface PropertyData {
  id: string;
  reference: string;
  address: string;
  city: string | null;
  postalCode: string | null;
  propertyType: string | null;
  rentHT: number | null;
  rentPeriod: "MENSUEL" | "ANNUEL" | null;
  priceFAI: number | null;
  isHidden: boolean;
  createdAt: string;
  createdBy: { name: string };
  apportedByCompany: { id: string; name: string } | null;
  apportedByContact: {
    id: string;
    firstName: string;
    lastName: string | null;
    company: { id: string; name: string } | null;
  } | null;
  characteristics: { id: string; label: string; value: string }[];
  photos: {
    id: string;
    filePath: string;
    fileName: string;
  }[];
  documents: {
    id: string;
    title: string;
    note: string | null;
    fileName: string;
    filePath: string;
    mimeType: string | null;
    size: number | null;
    folderId: string | null;
    createdAt: string;
  }[];
  notes: { id: string; title: string; content: string; createdAt: string }[];
  proposals: {
    id: string;
    status: string;
    company: { id: string; name: string } | null;
    contact: {
      id: string;
      firstName: string;
      lastName: string | null;
      company: { id: string; name: string } | null;
    } | null;
    notes: { id: string; title: string; content: string; createdAt: string }[];
  }[];
}

interface CharLabel {
  id: string;
  label: string;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const propertyId = params.id as string;
  const admin = session?.user?.role === "ADMIN";

  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchProperty = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`);
      if (!res.ok) {
        router.push("/biens");
        return;
      }
      setProperty(await res.json());
    } catch {
      router.push("/biens");
    } finally {
      setLoading(false);
    }
  }, [propertyId, router]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  const handleDelete = async () => {
    if (!confirm("Supprimer ce bien et toutes ses données ?")) return;
    await fetch(`/api/properties/${propertyId}`, { method: "DELETE" });
    router.push("/biens");
  };

  const toggleVisibility = async () => {
    if (!property) return;
    await fetch(`/api/properties/${propertyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHidden: !property.isHidden }),
    });
    fetchProperty();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) return null;

  const apporteurName = property.apportedByCompany
    ? property.apportedByCompany.name
    : property.apportedByContact
      ? `${property.apportedByContact.firstName} ${property.apportedByContact.lastName || ""}`.trim()
      : "—";

  const apporteurLink = property.apportedByCompany
    ? `/societes/${property.apportedByCompany.id}`
    : property.apportedByContact
      ? `/contacts/${property.apportedByContact.id}`
      : null;

  const rentability = (() => {
    if (!property.rentHT || !property.priceFAI || property.priceFAI === 0) return null;
    const annual = property.rentPeriod === "MENSUEL" ? property.rentHT * 12 : property.rentHT;
    return ((annual / property.priceFAI) * 100).toFixed(2);
  })();

  return (
    <div className="space-y-6">
      <Link
        href="/biens"
        className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Biens
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-navy-900">
                {property.reference}
              </h1>
              {property.propertyType && (
                <Badge variant="blue" size="md">
                  {property.propertyType}
                </Badge>
              )}
              {rentability && (
                <Badge variant="green" size="md">
                  {rentability}%
                </Badge>
              )}
              {property.isHidden && (
                <Badge variant="red" size="md">
                  Caché
                </Badge>
              )}
            </div>
            <p className="text-sm text-navy-600 mt-1">{property.address}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-navy-500">
              <span>
                Apporté par{" "}
                {apporteurLink ? (
                  <Link href={apporteurLink} className="text-primary-600 hover:underline">
                    {apporteurName}
                  </Link>
                ) : (
                  apporteurName
                )}
                {property.apportedByContact?.company && (
                  <>
                    {" "}(
                    <Link
                      href={`/societes/${property.apportedByContact.company.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      {property.apportedByContact.company.name}
                    </Link>
                    )
                  </>
                )}
              </span>
              <span>·</span>
              <span>Créé par {property.createdBy.name}</span>
              <span>·</span>
              <span>
                {new Date(property.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowEditModal(true)}>
              <Pencil className="w-4 h-4" /> Modifier
            </Button>
            {admin && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleVisibility}
                  title={property.isHidden ? "Rendre visible aux freelances" : "Cacher aux freelances"}
                >
                  {property.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {property.isHidden ? "Afficher" : "Cacher"}
                </Button>
                <Button size="sm" variant="danger" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" /> Supprimer
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Propositions */}
      <ProposalsSection
        propertyId={propertyId}
        proposals={property.proposals}
        admin={admin}
        onRefresh={fetchProperty}
      />

      {/* Caractéristiques */}
      <CharacteristicsSection
        propertyId={propertyId}
        characteristics={property.characteristics}
        onRefresh={fetchProperty}
      />

      {/* Photos */}
      <PhotosSection
        propertyId={propertyId}
        photos={property.photos}
        admin={admin}
        onRefresh={fetchProperty}
      />

      {/* Documents */}
      <FileManager
        documents={property.documents}
        entityType="PROPERTY"
        entityId={propertyId}
        apiBase={`/api/properties/${propertyId}/documents`}
        isAdmin={admin}
        onRefresh={fetchProperty}
      />

      {/* Notes */}
      <NotesSection
        notes={property.notes}
        apiBase={`/api/properties/${propertyId}/notes`}
        isAdmin={admin}
        onRefresh={fetchProperty}
      />

      {/* Modal d'édition du bien */}
      <EditPropertyModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        property={property}
        propertyId={propertyId}
        onSaved={fetchProperty}
      />
    </div>
  );
}

// ==========================================
// EDIT PROPERTY MODAL
// ==========================================
interface Apporteur {
  type: "company" | "contact";
  id: string;
  name: string;
}

interface TypeLabel {
  id: string;
  label: string;
}

function EditPropertyModal({
  isOpen,
  onClose,
  property,
  propertyId,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyData;
  propertyId: string;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Apporteur
  const [apporteur, setApporteur] = useState<Apporteur | null>(null);

  // Address
  const [addressData, setAddressData] = useState<{
    address: string;
    city: string;
    postalCode: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [addressChanged, setAddressChanged] = useState(false);

  // Other fields
  const [propertyType, setPropertyType] = useState("");
  const [rentHT, setRentHT] = useState("");
  const [rentPeriod, setRentPeriod] = useState<"MENSUEL" | "ANNUEL">("ANNUEL");
  const [priceFAI, setPriceFAI] = useState("");

  // Init state from property when modal opens
  useEffect(() => {
    if (isOpen && property) {
      // Apporteur
      if (property.apportedByCompany) {
        setApporteur({
          type: "company",
          id: property.apportedByCompany.id,
          name: property.apportedByCompany.name,
        });
      } else if (property.apportedByContact) {
        setApporteur({
          type: "contact",
          id: property.apportedByContact.id,
          name: `${property.apportedByContact.firstName} ${property.apportedByContact.lastName || ""}`.trim(),
        });
      } else {
        setApporteur(null);
      }

      // Address (already set, just mark as not changed)
      setAddressData(null);
      setAddressChanged(false);

      // Other fields
      setPropertyType(property.propertyType || "");
      setRentHT(property.rentHT?.toString() || "");
      setRentPeriod(property.rentPeriod || "ANNUEL");
      setPriceFAI(property.priceFAI?.toString() || "");
      setError("");
    }
  }, [isOpen, property]);

  const computedRentability = (() => {
    const rent = parseFloat(rentHT);
    const price = parseFloat(priceFAI);
    if (!rent || !price || price === 0) return null;
    const annual = rentPeriod === "MENSUEL" ? rent * 12 : rent;
    return ((annual / price) * 100).toFixed(2);
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!apporteur) {
      setError("Sélectionnez un apporteur");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        propertyType: propertyType || null,
        rentHT: rentHT ? parseFloat(rentHT) : null,
        rentPeriod,
        priceFAI: priceFAI ? parseFloat(priceFAI) : null,
      };

      // Apporteur
      if (apporteur.type === "company") {
        body.apportedByCompanyId = apporteur.id;
      } else {
        body.apportedByContactId = apporteur.id;
      }

      // Adresse (seulement si changée)
      if (addressChanged && addressData) {
        body.address = addressData.address;
        body.city = addressData.city;
        body.postalCode = addressData.postalCode;
        body.lat = addressData.lat;
        body.lng = addressData.lng;
      }

      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la modification");
      }

      onClose();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le bien" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Apporteur */}
        <ApporteurSearch onSelect={setApporteur} selected={apporteur} />

        {/* Adresse actuelle */}
        {!addressChanged ? (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-navy-700">Adresse</label>
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-navy-200 bg-navy-50">
              <span className="text-sm text-navy-900 truncate">{property.address}</span>
              <button
                type="button"
                onClick={() => setAddressChanged(true)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium shrink-0 ml-2"
              >
                Changer
              </button>
            </div>
            {(property.city || property.postalCode) && (
              <div className="flex gap-4 text-sm">
                <div className="flex-1 px-3 py-2 rounded-lg bg-navy-50 text-navy-700">
                  <span className="text-navy-500 text-xs">Ville :</span> {property.city || "—"}
                </div>
                <div className="flex-1 px-3 py-2 rounded-lg bg-navy-50 text-navy-700">
                  <span className="text-navy-500 text-xs">CP :</span> {property.postalCode || "—"}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <AddressAutocomplete onSelect={(data) => setAddressData(data)} />
            {addressData && (
              <div className="flex gap-4 text-sm mt-2">
                <div className="flex-1 px-3 py-2 rounded-lg bg-navy-50 text-navy-700">
                  <span className="text-navy-500 text-xs">Ville :</span> {addressData.city || "—"}
                </div>
                <div className="flex-1 px-3 py-2 rounded-lg bg-navy-50 text-navy-700">
                  <span className="text-navy-500 text-xs">CP :</span> {addressData.postalCode || "—"}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setAddressChanged(false);
                setAddressData(null);
              }}
              className="text-xs text-navy-500 hover:text-navy-700 mt-1"
            >
              Annuler le changement
            </button>
          </div>
        )}

        {/* Type de bien */}
        <EditPropertyTypeSelector value={propertyType} onChange={setPropertyType} />

        {/* Loyer HT + période */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-navy-700">Loyer HT</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.01"
                value={rentHT}
                onChange={(e) => setRentHT(e.target.value)}
                placeholder="Ex: 36000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 text-sm">
                &euro;
              </span>
            </div>
            <div className="flex rounded-xl border border-navy-200 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setRentPeriod("MENSUEL")}
                className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                  rentPeriod === "MENSUEL"
                    ? "bg-primary-500 text-white"
                    : "bg-white text-navy-600 hover:bg-navy-50"
                }`}
              >
                /mois
              </button>
              <button
                type="button"
                onClick={() => setRentPeriod("ANNUEL")}
                className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                  rentPeriod === "ANNUEL"
                    ? "bg-primary-500 text-white"
                    : "bg-white text-navy-600 hover:bg-navy-50"
                }`}
              >
                /an
              </button>
            </div>
          </div>
        </div>

        {/* Prix FAI */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-navy-700">Prix FAI</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={priceFAI}
              onChange={(e) => setPriceFAI(e.target.value)}
              placeholder="Ex: 500000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 text-sm">
              &euro;
            </span>
          </div>
        </div>

        {/* Rentabilité */}
        {computedRentability && (
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
            <span className="text-emerald-700 font-medium">
              Rentabilité : {computedRentability}%
            </span>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ==========================================
// EDIT PROPERTY TYPE SELECTOR
// ==========================================
function EditPropertyTypeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [labels, setLabels] = useState<TypeLabel[]>([]);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchLabels = useCallback(async () => {
    const res = await fetch("/api/property-type-labels");
    if (res.ok) setLabels(await res.json());
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = labels.filter((l) =>
    l.label.toLowerCase().includes(search.toLowerCase())
  );
  const exactMatch = labels.some((l) => l.label.toLowerCase() === search.toLowerCase());

  const selectType = (label: string) => {
    onChange(label);
    setSearch("");
    setOpen(false);
  };

  const createAndSelect = async () => {
    if (!search.trim()) return;
    setLoadingCreate(true);
    const res = await fetch("/api/property-type-labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: search.trim() }),
    });
    if (res.ok) {
      const created = await res.json();
      setLabels((prev) => [...prev, created].sort((a, b) => a.label.localeCompare(b.label)));
      selectType(created.label);
    }
    setLoadingCreate(false);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="block text-sm font-medium text-navy-700">Type de bien</label>
      {value ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3.5 py-2.5 rounded-xl border border-navy-200 bg-navy-50 text-sm text-navy-900">
            {value}
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-2 text-navy-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher ou créer un type..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {open && (
            <div className="absolute z-50 w-full mt-1 rounded-xl border border-navy-200 bg-white shadow-lg max-h-48 overflow-y-auto">
              {filtered.length === 0 && !search.trim() && (
                <div className="px-4 py-3 text-sm text-navy-400">Aucun type disponible</div>
              )}
              {filtered.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => selectType(label.label)}
                  className="w-full text-left px-4 py-2.5 text-sm text-navy-700 hover:bg-primary-50 transition-colors"
                >
                  {label.label}
                </button>
              ))}
              {search.trim() && !exactMatch && (
                <button
                  type="button"
                  onClick={createAndSelect}
                  disabled={loadingCreate}
                  className="w-full text-left px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50 transition-colors flex items-center gap-2 border-t border-navy-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Créer &quot;{search.trim()}&quot;
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// PROPOSITIONS SECTION
// ==========================================
interface SearchResult {
  id: string;
  name: string;
  type: "company" | "contact";
  subtitle?: string;
}

function ProposalsSection({
  propertyId,
  proposals,
  onRefresh,
}: {
  propertyId: string;
  proposals: PropertyData["proposals"];
  admin: boolean;
  onRefresh: () => void;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [noteModal, setNoteModal] = useState<{ proposalId: string; noteId?: string } | null>(null);
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [noteLoading, setNoteLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const searchAll = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.length < 2) { setSearchResults([]); return; }

    searchTimeoutRef.current = setTimeout(async () => {
      const [companiesRes, contactsRes] = await Promise.all([
        fetch(`/api/companies?search=${encodeURIComponent(value)}&limit=5`),
        fetch(`/api/contacts?search=${encodeURIComponent(value)}&limit=5`),
      ]);
      const [companiesData, contactsData] = await Promise.all([
        companiesRes.json(),
        contactsRes.json(),
      ]);

      const results: SearchResult[] = [
        ...companiesData.data.map((c: { id: string; name: string }) => ({
          id: c.id,
          name: c.name,
          type: "company" as const,
          subtitle: "Société",
        })),
        ...contactsData.data.map((c: { id: string; firstName: string; lastName: string | null; company: { name: string } | null }) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName || ""}`.trim(),
          type: "contact" as const,
          subtitle: c.company ? c.company.name : "Contact indépendant",
        })),
      ];

      setSearchResults(results);
    }, 300);
  };

  const addProposal = async (result: SearchResult) => {
    const body = result.type === "company"
      ? { companyId: result.id }
      : { contactId: result.id };

    await fetch(`/api/properties/${propertyId}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    onRefresh();
  };

  const toggleStatus = async (proposalId: string, currentStatus: string) => {
    await fetch(`/api/properties/${propertyId}/proposals/${proposalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: currentStatus === "ACTIF" ? "REFUSE" : "ACTIF",
      }),
    });
    onRefresh();
  };

  const saveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteModal) return;
    setNoteLoading(true);

    const isEdit = !!noteModal.noteId;
    const url = isEdit
      ? `/api/properties/${propertyId}/proposals/${noteModal.proposalId}/notes/${noteModal.noteId}`
      : `/api/properties/${propertyId}/proposals/${noteModal.proposalId}/notes`;

    await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noteForm),
    });
    setNoteModal(null);
    setNoteForm({ title: "", content: "" });
    setNoteLoading(false);
    onRefresh();
  };

  const deleteNote = async (proposalId: string, noteId: string) => {
    if (!confirm("Supprimer cette note ?")) return;
    await fetch(`/api/properties/${propertyId}/proposals/${proposalId}/notes/${noteId}`, {
      method: "DELETE",
    });
    onRefresh();
  };

  const openEditNote = (proposalId: string, note: { id: string; title: string; content: string }) => {
    setNoteForm({ title: note.title, content: note.content });
    setNoteModal({ proposalId, noteId: note.id });
  };

  const getProposalName = (proposal: PropertyData["proposals"][0]) => {
    if (proposal.company) return proposal.company.name;
    if (proposal.contact)
      return `${proposal.contact.firstName} ${proposal.contact.lastName || ""}`.trim();
    return "—";
  };

  const getProposalLink = (proposal: PropertyData["proposals"][0]) => {
    if (proposal.company) return `/societes/${proposal.company.id}`;
    if (proposal.contact) return `/contacts/${proposal.contact.id}`;
    return "#";
  };

  const getProposalSubtitle = (proposal: PropertyData["proposals"][0]) => {
    if (proposal.company) return null;
    if (proposal.contact?.company) return proposal.contact.company.name;
    return "Contact indépendant";
  };

  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
        <h3 className="font-semibold text-navy-900">
          Propositions ({proposals.length})
        </h3>
        <Button size="sm" variant="secondary" onClick={() => setShowSearch(!showSearch)}>
          <Plus className="w-4 h-4" /> Proposer
        </Button>
      </div>

      {/* Recherche société ou contact */}
      {showSearch && (
        <div className="px-5 py-3 border-b border-navy-100 bg-navy-50/50">
          <input
            type="text"
            placeholder="Rechercher une société ou un contact..."
            value={searchQuery}
            onChange={(e) => searchAll(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="mt-2 rounded-xl border border-navy-200 bg-white overflow-hidden">
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => addProposal(result)}
                  className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-navy-700">{result.name}</span>
                  <span className="text-xs text-navy-400">{result.subtitle}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-navy-500">
          Aucune proposition pour ce bien
        </div>
      ) : (
        <div className="divide-y divide-navy-100">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <Link
                    href={getProposalLink(proposal)}
                    className="font-medium text-navy-900 hover:text-primary-600 transition-colors text-sm"
                  >
                    {getProposalName(proposal)}
                  </Link>
                  {getProposalSubtitle(proposal) && (
                    <p className="text-xs text-navy-400 mt-0.5">
                      {getProposalSubtitle(proposal)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(proposal.id, proposal.status)}
                    className="transition-colors"
                  >
                    <Badge
                      variant={proposal.status === "ACTIF" ? "green" : "red"}
                      size="md"
                    >
                      {proposal.status === "ACTIF" ? "Actif" : "Refusé"}
                    </Badge>
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNoteForm({ title: "", content: "" });
                      setNoteModal({ proposalId: proposal.id });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Note
                  </Button>
                </div>
              </div>

              {/* Notes de la proposition */}
              {proposal.notes.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-navy-100 space-y-2">
                  {proposal.notes.map((note) => (
                    <div key={note.id} className="group/note">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-navy-800">
                            {note.title}
                          </p>
                          <p className="text-sm text-navy-600">{note.content}</p>
                          <p className="text-xs text-navy-400 mt-0.5">
                            {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => openEditNote(proposal.id, note)}
                            className="p-1 text-navy-400 hover:text-primary-600 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteNote(proposal.id, note.id)}
                            className="p-1 text-navy-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal note proposition */}
      <Modal
        isOpen={!!noteModal}
        onClose={() => { setNoteModal(null); setNoteForm({ title: "", content: "" }); }}
        title={noteModal?.noteId ? "Modifier la note" : "Note de suivi"}
      >
        <form onSubmit={saveNote} className="space-y-4">
          <Input
            label="Titre *"
            value={noteForm.title}
            onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
          />
          <Textarea
            label="Contenu *"
            value={noteForm.content}
            onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setNoteModal(null); setNoteForm({ title: "", content: "" }); }}>
              Annuler
            </Button>
            <Button type="submit" loading={noteLoading}>
              {noteModal?.noteId ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ==========================================
// CHARACTERISTICS SECTION
// ==========================================
function CharacteristicsSection({
  propertyId,
  characteristics,
  onRefresh,
}: {
  propertyId: string;
  characteristics: PropertyData["characteristics"];
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [labels, setLabels] = useState<CharLabel[]>([]);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [value, setValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const fetchLabels = async () => {
    const res = await fetch("/api/characteristic-labels");
    setLabels(await res.json());
  };

  const openAdd = () => {
    fetchLabels();
    setSelectedLabel("");
    setCustomLabel("");
    setValue("");
    setShowModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = selectedLabel === "__custom" ? customLabel : selectedLabel;
    if (!label || !value) return;

    await fetch(`/api/properties/${propertyId}/characteristics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, value }),
    });
    setShowModal(false);
    onRefresh();
  };

  const handleEdit = async (charId: string) => {
    await fetch(`/api/properties/${propertyId}/characteristics/${charId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: editValue }),
    });
    setEditingId(null);
    onRefresh();
  };

  const handleDelete = async (charId: string) => {
    await fetch(`/api/properties/${propertyId}/characteristics/${charId}`, {
      method: "DELETE",
    });
    onRefresh();
  };

  const existingLabels = new Set(characteristics.map((c) => c.label));

  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
        <h3 className="font-semibold text-navy-900">Caractéristiques</h3>
        <Button size="sm" variant="secondary" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {characteristics.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-navy-500">
          Aucune caractéristique
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-navy-100">
          {characteristics.map((char) => (
            <div key={char.id} className="bg-white px-5 py-3">
              <p className="text-xs font-medium text-navy-500 uppercase">
                {char.label}
              </p>
              {editingId === char.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit(char.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <button
                    onClick={() => handleEdit(char.id)}
                    className="text-primary-600 text-xs font-medium"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-semibold text-navy-900">
                    {char.value}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(char.id);
                        setEditValue(char.value);
                      }}
                      className="p-1 text-navy-400 hover:text-primary-600 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(char.id)}
                      className="p-1 text-navy-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Ajouter une caractéristique">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-navy-700">Type</label>
            <select
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">Sélectionner...</option>
              {labels
                .filter((l) => !existingLabels.has(l.label))
                .map((l) => (
                  <option key={l.id} value={l.label}>{l.label}</option>
                ))}
              <option value="__custom">+ Créer un type custom</option>
            </select>
          </div>
          {selectedLabel === "__custom" && (
            <Input
              label="Nom du type custom"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Ex: Distance métro"
            />
          )}
          <Input
            label="Valeur *"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex: 250 000 €"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ==========================================
// PHOTOS SECTION
// ==========================================
function PhotosSection({
  propertyId,
  photos,
  admin,
  onRefresh,
}: {
  propertyId: string;
  photos: PropertyData["photos"];
  admin: boolean;
  onRefresh: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("photos", files[i]);
    }

    await fetch(`/api/properties/${propertyId}/photos`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onRefresh();
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm("Supprimer cette photo ?")) return;
    await fetch(`/api/properties/${propertyId}/photos/${photoId}`, {
      method: "DELETE",
    });
    onRefresh();
  };

  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
        <h3 className="font-semibold text-navy-900">
          Photos ({photos.length})
        </h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
          >
            <ImagePlus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <EmptyState icon={Camera} title="Aucune photo" />
      ) : (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden bg-navy-100">
              <img
                src={photo.filePath}
                alt={photo.fileName}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={photo.filePath}
                  download={photo.fileName}
                  className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-primary-500 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                {admin && (
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
