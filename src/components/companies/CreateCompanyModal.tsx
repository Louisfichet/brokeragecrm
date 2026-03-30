"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import SearchTypeInput from "@/components/ui/SearchTypeInput";

const COMPANY_TYPES = [
  { value: "APPORTEUR", label: "Apporteur" },
  { value: "ACHETEUR", label: "Acheteur" },
  { value: "PROPRIETAIRE", label: "Propriétaire" },
];

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCompanyModal({
  isOpen,
  onClose,
}: CreateCompanyModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    website: "",
    description: "",
    types: [] as string[],
    searchTypeLabels: [] as string[],
  });

  const toggleType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Le nom est requis");
      return;
    }
    if (form.types.length === 0) {
      setError("Sélectionnez au moins un type");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      const company = await res.json();
      onClose();
      setForm({ name: "", website: "", description: "", types: [], searchTypeLabels: [] });
      router.push(`/societes/${company.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle société">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom de la société *"
          placeholder="Ex: Groupe Immobilier ABC"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                onClick={() => toggleType(type.value)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                  form.types.includes(type.value)
                    ? "bg-primary-50 border-primary-300 text-primary-700"
                    : "bg-white border-navy-200 text-navy-600 hover:bg-navy-50"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <SearchTypeInput
          label="Type(s) de recherche"
          value={form.searchTypeLabels}
          onChange={(val) => setForm({ ...form, searchTypeLabels: val })}
        />

        <Input
          label="Site web"
          placeholder="https://..."
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />

        <Textarea
          label="Description"
          placeholder="Informations complémentaires..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

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
            Créer la société
          </Button>
        </div>
      </form>
    </Modal>
  );
}
