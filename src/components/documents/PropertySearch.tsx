"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X } from "lucide-react";

interface PropertyResult {
  id: string;
  reference: string;
  address: string;
  city: string | null;
  priceFAI: number | null;
}

interface PropertySearchProps {
  label: string;
  value: PropertyResult | null;
  onChange: (property: PropertyResult | null) => void;
}

export default function PropertySearch({
  label,
  value,
  onChange,
}: PropertySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PropertyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/properties?search=${encodeURIComponent(query)}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(
            data.data.map((p: Record<string, unknown>) => ({
              id: p.id,
              reference: p.reference,
              address: p.address,
              city: p.city,
              priceFAI: p.priceFAI,
            }))
          );
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (value) {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-navy-700">
          {label}
        </label>
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-primary-200 bg-primary-50/50">
          <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy-900 truncate">
              {value.reference} — {value.address}
            </p>
            {value.city && (
              <p className="text-xs text-navy-500">{value.city}</p>
            )}
          </div>
          <button
            onClick={() => onChange(null)}
            className="p-1 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-navy-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5" ref={wrapperRef}>
      <label className="block text-sm font-medium text-navy-700">
        {label}
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Rechercher par référence ou adresse..."
          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
        />

        {open && (results.length > 0 || loading) && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-navy-100 shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-navy-400 text-center">
                Recherche...
              </div>
            ) : (
              results.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => {
                    onChange(prop);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-navy-50 transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-navy-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">
                      {prop.reference} — {prop.address}
                    </p>
                    <p className="text-xs text-navy-500">
                      {prop.city}
                      {prop.priceFAI
                        ? ` — ${prop.priceFAI.toLocaleString("fr-FR")} €`
                        : ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
