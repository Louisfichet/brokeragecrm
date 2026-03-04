"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Building2, User, X } from "lucide-react";

interface CrmEntity {
  id: string;
  type: "company" | "contact";
  name: string;
  subtitle?: string;
  email?: string;
}

interface CrmSearchProps {
  label: string;
  placeholder?: string;
  value: CrmEntity | null;
  onChange: (entity: CrmEntity | null) => void;
  entityTypes?: ("company" | "contact")[];
}

export default function CrmSearch({
  label,
  placeholder = "Rechercher...",
  value,
  onChange,
  entityTypes = ["company", "contact"],
}: CrmSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CrmEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Stabiliser entityTypes pour éviter les re-renders en boucle
  const entityTypesKey = useMemo(() => entityTypes.join(","), [entityTypes]);

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
      const entities: CrmEntity[] = [];

      try {
        if (entityTypesKey.includes("company")) {
          const res = await fetch(
            `/api/companies?search=${encodeURIComponent(query)}&limit=5`
          );
          if (res.ok) {
            const data = await res.json();
            for (const c of data.data) {
              entities.push({
                id: c.id,
                type: "company",
                name: c.name,
                subtitle: c.types?.map((t: { type: string }) => t.type).join(", "),
              });
            }
          }
        }

        if (entityTypesKey.includes("contact")) {
          const res = await fetch(
            `/api/contacts?search=${encodeURIComponent(query)}&limit=5`
          );
          if (res.ok) {
            const data = await res.json();
            for (const c of data.data) {
              entities.push({
                id: c.id,
                type: "contact",
                name: `${c.firstName} ${c.lastName || ""}`.trim(),
                subtitle: c.company?.name || "Contact indépendant",
                email: c.email || undefined,
              });
            }
          }
        }
      } catch (err) {
        console.error(err);
      }

      setResults(entities);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, entityTypesKey]);

  if (value) {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-navy-700">
          {label}
        </label>
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-primary-200 bg-primary-50/50">
          {value.type === "company" ? (
            <Building2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
          ) : (
            <User className="w-4 h-4 text-primary-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy-900 truncate">
              {value.name}
            </p>
            {value.subtitle && (
              <p className="text-xs text-navy-500 truncate">{value.subtitle}</p>
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
          placeholder={placeholder}
          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
        />

        {open && (results.length > 0 || loading) && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-navy-100 shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-navy-400 text-center">
                Recherche...
              </div>
            ) : (
              results.map((entity) => (
                <button
                  key={`${entity.type}-${entity.id}`}
                  onClick={() => {
                    onChange(entity);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-navy-50 transition-colors text-left"
                >
                  {entity.type === "company" ? (
                    <Building2 className="w-4 h-4 text-navy-400 flex-shrink-0" />
                  ) : (
                    <User className="w-4 h-4 text-navy-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">
                      {entity.name}
                    </p>
                    {entity.subtitle && (
                      <p className="text-xs text-navy-500 truncate">
                        {entity.subtitle}
                      </p>
                    )}
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
