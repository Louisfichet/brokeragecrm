"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface SearchTypeInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
}

export default function SearchTypeInput({
  value,
  onChange,
  label,
  placeholder = "Ex: Immeuble, Hôtel social...",
}: SearchTypeInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: string; label: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-types?q=${encodeURIComponent(input.trim())}`);
        const data = await res.json();
        // Filter out already selected
        const filtered = data.filter(
          (st: { label: string }) => !value.includes(st.label)
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
        setHighlightIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [input, value]);

  const addTag = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (label: string) => {
    onChange(value.filter((v) => v !== label));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        addTag(suggestions[highlightIndex].label);
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const exactMatch = suggestions.some(
    (s) => s.label.toLowerCase() === input.trim().toLowerCase()
  );

  return (
    <div ref={wrapperRef} className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-navy-700">
          {label}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl border border-navy-200 bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent min-h-[42px]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-purple-900 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => input.trim() && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : "Ajouter..."}
          className="flex-1 min-w-[120px] outline-none text-sm text-navy-900 placeholder-navy-400 bg-transparent"
        />
      </div>

      {showSuggestions && (suggestions.length > 0 || (input.trim() && !exactMatch)) && (
        <div className="relative">
          <div className="absolute z-50 w-full bg-white border border-navy-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => addTag(s.label)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  i === highlightIndex
                    ? "bg-primary-50 text-primary-700"
                    : "text-navy-700 hover:bg-navy-50"
                }`}
              >
                {s.label}
              </button>
            ))}
            {input.trim() && !exactMatch && (
              <button
                type="button"
                onClick={() => addTag(input)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors border-t border-navy-100 ${
                  highlightIndex === suggestions.length
                    ? "bg-primary-50 text-primary-700"
                    : "text-navy-500 hover:bg-navy-50"
                }`}
              >
                Créer &quot;{input.trim()}&quot;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
