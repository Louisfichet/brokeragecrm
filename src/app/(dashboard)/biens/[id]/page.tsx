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
import DocumentsSection from "@/components/shared/DocumentsSection";

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
          {admin && (
            <div className="flex gap-2">
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
            </div>
          )}
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
      <DocumentsSection
        documents={property.documents}
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
