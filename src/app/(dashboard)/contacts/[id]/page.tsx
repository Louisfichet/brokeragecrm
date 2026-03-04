"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  EyeOff,
  Eye,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import NotesSection from "@/components/shared/NotesSection";
import DocumentsSection from "@/components/shared/DocumentsSection";

interface ContactData {
  id: string;
  firstName: string;
  isHidden: boolean;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  civilite: string | null;
  adresse: string | null;
  company: { id: string; name: string; types: { type: string }[] } | null;
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

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const contactId = params.id as string;
  const admin = session?.user?.role === "ADMIN";

  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    civilite: "",
    adresse: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  const fetchContact = useCallback(async () => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (!res.ok) {
        router.push("/societes");
        return;
      }
      const data = await res.json();
      setContact(data);
    } catch {
      router.push("/societes");
    } finally {
      setLoading(false);
    }
  }, [contactId, router]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  const openEdit = () => {
    if (!contact) return;
    setEditForm({
      firstName: contact.firstName,
      lastName: contact.lastName || "",
      email: contact.email || "",
      phone: contact.phone || "",
      role: contact.role || "",
      civilite: contact.civilite || "",
      adresse: contact.adresse || "",
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setShowEditModal(false);
      fetchContact();
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer ce contact et toutes ses données ?")) return;
    try {
      await fetch(`/api/contacts/${contactId}`, { method: "DELETE" });
      router.push("/societes");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleVisibility = async () => {
    if (!contact) return;
    await fetch(`/api/contacts/${contactId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHidden: !contact.isHidden }),
    });
    fetchContact();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contact) return null;

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
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-navy-900">
                {contact.firstName} {contact.lastName || ""}
              </h1>
              {contact.isHidden && (
                <Badge variant="red" size="md">
                  Caché
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-primary-600 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-primary-600 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> {contact.phone}
                </a>
              )}
            </div>
            {contact.company && (
              <p className="text-sm text-navy-500 mt-2">
                Rattaché à{" "}
                <Link
                  href={`/societes/${contact.company.id}`}
                  className="text-primary-600 hover:underline"
                >
                  {contact.company.name}
                </Link>
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {admin && (
              <Button
                size="sm"
                variant="secondary"
                onClick={toggleVisibility}
                title={contact.isHidden ? "Rendre visible" : "Cacher"}
              >
                {contact.isHidden ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={openEdit}>
              <Pencil className="w-4 h-4" /> Modifier
            </Button>
            {admin && (
              <Button size="sm" variant="danger" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Informations juridiques */}
      {(contact.civilite || contact.adresse) && (
        <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
          <div className="px-5 py-4 border-b border-navy-100">
            <h3 className="font-semibold text-navy-900">Informations juridiques</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {contact.civilite && (
              <div>
                <p className="text-navy-500 text-xs font-medium uppercase">Civilité</p>
                <p className="text-navy-900">{contact.civilite}</p>
              </div>
            )}
            {contact.adresse && (
              <div className="sm:col-span-2">
                <p className="text-navy-500 text-xs font-medium uppercase">Adresse</p>
                <p className="text-navy-900">{contact.adresse}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <NotesSection
        notes={contact.notes}
        apiBase={`/api/contacts/${contactId}/notes`}
        isAdmin={admin}
        onRefresh={fetchContact}
      />

      {/* Documents */}
      <DocumentsSection
        documents={contact.documents}
        apiBase={`/api/contacts/${contactId}/documents`}
        isAdmin={admin}
        onRefresh={fetchContact}
      />

      {/* Biens apportés */}
      {contact.propertiesApported.length > 0 && (
        <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
          <div className="px-5 py-4 border-b border-navy-100">
            <h3 className="font-semibold text-navy-900">
              Biens apportés ({contact.propertiesApported.length})
            </h3>
          </div>
          <div className="divide-y divide-navy-50">
            {contact.propertiesApported.map((prop) => (
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
      {contact.proposalsReceived.length > 0 && (
        <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
          <div className="px-5 py-4 border-b border-navy-100">
            <h3 className="font-semibold text-navy-900">
              Biens proposés ({contact.proposalsReceived.length})
            </h3>
          </div>
          <div className="divide-y divide-navy-50">
            {contact.proposalsReceived.map((proposal) => (
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

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier le contact"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom *"
              value={editForm.firstName}
              onChange={(e) =>
                setEditForm({ ...editForm, firstName: e.target.value })
              }
            />
            <Input
              label="Nom"
              value={editForm.lastName}
              onChange={(e) =>
                setEditForm({ ...editForm, lastName: e.target.value })
              }
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) =>
              setEditForm({ ...editForm, email: e.target.value })
            }
          />
          <Input
            label="Téléphone"
            type="tel"
            value={editForm.phone}
            onChange={(e) =>
              setEditForm({ ...editForm, phone: e.target.value })
            }
          />

          {/* Informations juridiques */}
          <div className="border-t border-navy-100 pt-4 mt-2">
            <p className="text-sm font-semibold text-navy-700 mb-3">Informations juridiques</p>
            <div className="space-y-4">
              <Input
                label="Civilité"
                value={editForm.civilite}
                onChange={(e) => setEditForm({ ...editForm, civilite: e.target.value })}
                placeholder="M. / Mme"
              />
              <Input
                label="Adresse"
                value={editForm.adresse}
                onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })}
                placeholder="1 rue de la Paix, 75001 Paris"
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
    </div>
  );
}
