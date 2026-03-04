"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Building2, User } from "lucide-react";

interface Apporteur {
  type: "company" | "contact";
  id: string;
  name: string;
  detail?: string;
}

interface ApporteurSearchProps {
  onSelect: (apporteur: Apporteur) => void;
  selected: Apporteur | null;
}

export default function ApporteurSearch({ onSelect, selected }: ApporteurSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Apporteur[]>([]);
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

    if (value.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [companiesRes, contactsRes] = await Promise.all([
          fetch(`/api/companies?search=${encodeURIComponent(value)}&limit=5`),
          fetch(`/api/contacts?search=${encodeURIComponent(value)}&limit=5`),
        ]);

        const companiesData = await companiesRes.json();
        const contactsData = await contactsRes.json();

        const merged: Apporteur[] = [
          ...companiesData.data.map((c: { id: string; name: string }) => ({
            type: "company" as const,
            id: c.id,
            name: c.name,
          })),
          ...contactsData.data.map(
            (c: { id: string; firstName: string; lastName: string | null; email: string | null }) => ({
              type: "contact" as const,
              id: c.id,
              name: `${c.firstName} ${c.lastName || ""}`.trim(),
              detail: c.email || undefined,
            })
          ),
        ];

        setResults(merged);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  if (selected) {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-navy-700">
          Apporteur *
        </label>
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-navy-200 bg-navy-50">
          <div className="flex items-center gap-2">
            {selected.type === "company" ? (
              <Building2 className="w-4 h-4 text-navy-500" />
            ) : (
              <User className="w-4 h-4 text-navy-500" />
            )}
            <span className="text-sm text-navy-900 font-medium">
              {selected.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null as unknown as Apporteur);
              setQuery("");
            }}
            className="text-xs text-navy-500 hover:text-red-500 transition-colors"
          >
            Changer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-navy-700 mb-1.5">
        Apporteur *
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Rechercher une société ou un contact..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-navy-200 shadow-lg max-h-60 overflow-y-auto">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              type="button"
              onClick={() => {
                onSelect(result);
                setShowResults(false);
                setQuery("");
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors flex items-center gap-2 first:rounded-t-xl last:rounded-b-xl"
            >
              {result.type === "company" ? (
                <Building2 className="w-4 h-4 text-navy-400 flex-shrink-0" />
              ) : (
                <User className="w-4 h-4 text-navy-400 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm text-navy-900 font-medium">{result.name}</p>
                {result.detail && (
                  <p className="text-xs text-navy-500">{result.detail}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
