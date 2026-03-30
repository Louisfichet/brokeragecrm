"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SearchTypeInput from "@/components/ui/SearchTypeInput";

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  onCreated?: () => void;
}

export default function CreateContactModal({
  isOpen,
  onClose,
  companyId,
  onCreated,
}: CreateContactModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    searchTypeLabels: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.firstName.trim()) {
      setError("Le prénom est requis");
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError("Un email ou un téléphone est requis");
      return;
    }

    setLoading(true);

    try {
      const url = companyId
        ? `/api/companies/${companyId}/contacts`
        : "/api/contacts";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, companyId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      const contact = await res.json();
      onClose();
      setForm({ firstName: "", lastName: "", email: "", phone: "", role: "", searchTypeLabels: [] });

      if (onCreated) {
        onCreated();
      } else {
        router.push(`/contacts/${contact.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={companyId ? "Ajouter un contact" : "Nouveau contact indépendant"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prénom *"
            placeholder="Jean"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            label="Nom"
            placeholder="Dupont"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="jean@exemple.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <Input
          label="Téléphone"
          type="tel"
          placeholder="06 12 34 56 78"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        {!companyId && (
          <SearchTypeInput
            label="Type(s) de recherche"
            value={form.searchTypeLabels}
            onChange={(val) => setForm({ ...form, searchTypeLabels: val })}
          />
        )}

        {companyId && (
          <Input
            label="Fonction"
            placeholder="Directeur commercial..."
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            {companyId ? "Ajouter le contact" : "Créer le contact"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
