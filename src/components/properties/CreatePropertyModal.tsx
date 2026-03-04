"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AddressAutocomplete from "./AddressAutocomplete";
import ApporteurSearch from "./ApporteurSearch";

interface CreatePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Apporteur {
  type: "company" | "contact";
  id: string;
  name: string;
}

interface TypeLabel {
  id: string;
  label: string;
}

export default function CreatePropertyModal({
  isOpen,
  onClose,
}: CreatePropertyModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apporteur, setApporteur] = useState<Apporteur | null>(null);
  const [addressData, setAddressData] = useState<{
    address: string;
    city: string;
    postalCode: string;
    lat: number;
    lng: number;
  } | null>(null);

  // Nouveaux champs
  const [propertyType, setPropertyType] = useState("");
  const [rentHT, setRentHT] = useState("");
  const [rentPeriod, setRentPeriod] = useState<"MENSUEL" | "ANNUEL">("ANNUEL");
  const [priceFAI, setPriceFAI] = useState("");

  // Calcul rentabilité en temps réel
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
    if (!addressData) {
      setError("Sélectionnez une adresse");
      return;
    }
    if (!rentHT || !priceFAI) {
      setError("Le loyer HT et le prix FAI sont requis");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: addressData.address,
          city: addressData.city,
          postalCode: addressData.postalCode,
          lat: addressData.lat,
          lng: addressData.lng,
          apportedByCompanyId:
            apporteur.type === "company" ? apporteur.id : undefined,
          apportedByContactId:
            apporteur.type === "contact" ? apporteur.id : undefined,
          propertyType: propertyType || undefined,
          rentHT: parseFloat(rentHT),
          rentPeriod,
          priceFAI: parseFloat(priceFAI),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      const property = await res.json();
      onClose();
      setApporteur(null);
      setAddressData(null);
      setPropertyType("");
      setRentHT("");
      setRentPeriod("ANNUEL");
      setPriceFAI("");
      router.push(`/biens/${property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau bien" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ApporteurSearch
          onSelect={setApporteur}
          selected={apporteur}
        />

        <AddressAutocomplete onSelect={setAddressData} />

        {addressData && (
          <div className="flex gap-4 text-sm">
            <div className="flex-1 px-3 py-2 rounded-lg bg-navy-50 text-navy-700">
              <span className="text-navy-500 text-xs">Ville :</span>{" "}
              {addressData.city || "—"}
            </div>
            <div className="flex-1 px-3 py-2 rounded-lg bg-navy-50 text-navy-700">
              <span className="text-navy-500 text-xs">CP :</span>{" "}
              {addressData.postalCode || "—"}
            </div>
          </div>
        )}

        {/* Type de bien */}
        <PropertyTypeSelector
          value={propertyType}
          onChange={setPropertyType}
        />

        {/* Loyer HT + période */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-navy-700">
            Loyer HT *
          </label>
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 text-sm">€</span>
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
          <label className="block text-sm font-medium text-navy-700">
            Prix FAI *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={priceFAI}
              onChange={(e) => setPriceFAI(e.target.value)}
              placeholder="Ex: 500000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 text-sm">€</span>
          </div>
        </div>

        {/* Rentabilité calculée */}
        {computedRentability && (
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
            <span className="text-emerald-700 font-medium">
              Rentabilité : {computedRentability}%
            </span>
            <span className="text-emerald-600 ml-1 text-xs">
              ({rentPeriod === "MENSUEL" ? `${parseFloat(rentHT) * 12} €/an` : `${rentHT} €/an`} / {parseFloat(priceFAI).toLocaleString("fr-FR")} €)
            </span>
          </div>
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
            Créer le bien
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ==========================================
// PROPERTY TYPE SELECTOR (avec recherche + custom)
// ==========================================
function PropertyTypeSelector({
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

  // Fermer la dropdown si on clique en dehors
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

  const exactMatch = labels.some(
    (l) => l.label.toLowerCase() === search.toLowerCase()
  );

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
      <label className="block text-sm font-medium text-navy-700">
        Type de bien
      </label>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          {open && (
            <div className="absolute z-50 w-full mt-1 rounded-xl border border-navy-200 bg-white shadow-lg max-h-48 overflow-y-auto">
              {filtered.length === 0 && !search.trim() && (
                <div className="px-4 py-3 text-sm text-navy-400">
                  Aucun type disponible
                </div>
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
