"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";

interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
  };
}

interface AddressAutocompleteProps {
  onSelect: (result: {
    address: string;
    city: string;
    postalCode: string;
    lat: number;
    lng: number;
  }) => void;
}

export default function AddressAutocomplete({ onSelect }: AddressAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = (value: string) => {
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (value.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=fr&limit=5&q=${encodeURIComponent(value)}`,
          { headers: { "Accept-Language": "fr" } }
        );
        const data: AddressResult[] = await res.json();
        setResults(data);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (result: AddressResult) => {
    const city =
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      result.address?.municipality ||
      "";
    const postalCode = result.address?.postcode || "";

    setQuery(result.display_name);
    setShowResults(false);
    onSelect({
      address: result.display_name,
      city,
      postalCode,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-navy-700 mb-1.5">
        Adresse *
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Rechercher une adresse..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-navy-200 shadow-lg max-h-60 overflow-y-auto">
          {results.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-2.5 text-sm text-navy-700 hover:bg-primary-50 hover:text-primary-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
