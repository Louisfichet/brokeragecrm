"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Filter,
  EyeOff,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import CreateCompanyModal from "@/components/companies/CreateCompanyModal";
import CreateContactModal from "@/components/contacts/CreateContactModal";

const TYPE_LABELS: Record<string, string> = {
  APPORTEUR: "Apporteur",
  ACHETEUR: "Acheteur",
  PROPRIETAIRE: "Propriétaire",
};

const TYPE_COLORS: Record<string, "blue" | "green" | "orange"> = {
  APPORTEUR: "orange",
  ACHETEUR: "blue",
  PROPRIETAIRE: "green",
};

interface Company {
  id: string;
  name: string;
  website: string | null;
  isHidden: boolean;
  types: { type: string }[];
  searchTypes: { searchType: { id: string; label: string } }[];
  contacts: { id: string; firstName: string; lastName: string | null; email: string | null; phone: string | null }[];
  _count: { propertiesApported: number; proposalsReceived: number };
  createdAt: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  isHidden: boolean;
  searchTypes: { searchType: { id: string; label: string } }[];
  company: null;
  createdAt: string;
}

type Tab = "societes" | "contacts";

export default function SocietesPage() {
  const [tab, setTab] = useState<Tab>("societes");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTypeFilter, setSearchTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allSearchTypes, setAllSearchTypes] = useState<{ id: string; label: string }[]>([]);

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const fetchSearchTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/search-types");
      const data = await res.json();
      setAllSearchTypes(data);
    } catch {
      // ignore
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "societes") {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          ...(search && { search }),
          ...(typeFilter && { type: typeFilter }),
          ...(searchTypeFilter && { searchType: searchTypeFilter }),
        });
        const res = await fetch(`/api/companies?${params}`);
        const data = await res.json();
        setCompanies(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          independent: "true",
          ...(search && { search }),
          ...(searchTypeFilter && { searchType: searchTypeFilter }),
        });
        const res = await fetch(`/api/contacts?${params}`);
        const data = await res.json();
        setContacts(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, page, search, typeFilter, searchTypeFilter]);

  useEffect(() => {
    fetchSearchTypes();
  }, [fetchSearchTypes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, typeFilter, searchTypeFilter]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Sociétés & Contacts
          </h1>
          <p className="text-navy-500 text-sm mt-1">
            Gestion de vos sociétés et contacts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowContactModal(true)}
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Contact</span>
          </Button>
          <Button size="sm" onClick={() => setShowCompanyModal(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Société</span>
          </Button>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
        {/* Tabs */}
        <div className="flex items-center border-b border-navy-100 px-4">
          <button
            onClick={() => setTab("societes")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "societes"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-navy-500 hover:text-navy-700"
            }`}
          >
            Sociétés
          </button>
          <button
            onClick={() => setTab("contacts")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "contacts"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-navy-500 hover:text-navy-700"
            }`}
          >
            Contacts indépendants
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-navy-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          {tab === "societes" && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="">Tous les types</option>
                <option value="APPORTEUR">Apporteur</option>
                <option value="ACHETEUR">Acheteur</option>
                <option value="PROPRIETAIRE">Propriétaire</option>
              </select>
            </div>
          )}
          {allSearchTypes.length > 0 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <select
                value={searchTypeFilter}
                onChange={(e) => setSearchTypeFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="">Toutes les recherches</option>
                {allSearchTypes.map((st) => (
                  <option key={st.id} value={st.label}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "societes" ? (
          companies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Aucune société"
              description="Commencez par ajouter votre première société"
              action={
                <Button size="sm" onClick={() => setShowCompanyModal(true)}>
                  <Plus className="w-4 h-4" /> Ajouter une société
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-navy-100">
                      <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                        Société
                      </th>
                      <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                        Recherche
                      </th>
                      <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                        Type(s)
                      </th>
                      <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                        Contacts
                      </th>
                      <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                        Biens
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50">
                    {companies.map((company) => (
                      <tr
                        key={company.id}
                        className={`hover:bg-navy-50/50 transition-colors ${company.isHidden ? "opacity-50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/societes/${company.id}`}
                              className="font-medium text-navy-900 hover:text-primary-600 transition-colors"
                            >
                              {company.name}
                            </Link>
                            {company.isHidden && (
                              <Badge variant="red" size="sm">
                                <EyeOff className="w-3 h-3" /> Caché
                              </Badge>
                            )}
                          </div>
                          {company.website && (
                            <p className="text-xs text-navy-400 mt-0.5 truncate max-w-[200px]">
                              {company.website}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {company.searchTypes.map((st) => (
                              <Badge
                                key={st.searchType.id}
                                variant="purple"
                                size="sm"
                              >
                                {st.searchType.label}
                              </Badge>
                            ))}
                            {company.searchTypes.length === 0 && (
                              <span className="text-sm text-navy-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {company.types.map((t) => (
                              <Badge
                                key={t.type}
                                variant={TYPE_COLORS[t.type] || "gray"}
                              >
                                {TYPE_LABELS[t.type] || t.type}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-navy-600">
                          {company.contacts.length}
                        </td>
                        <td className="px-4 py-3 text-sm text-navy-600">
                          {company._count.propertiesApported +
                            company._count.proposalsReceived}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-navy-100">
                {companies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/societes/${company.id}`}
                    className={`block px-4 py-3 hover:bg-navy-50/50 transition-colors ${company.isHidden ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-navy-900 truncate">
                            {company.name}
                          </p>
                          {company.isHidden && (
                            <Badge variant="red" size="sm">Caché</Badge>
                          )}
                        </div>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {company.types.map((t) => (
                            <Badge
                              key={t.type}
                              variant={TYPE_COLORS[t.type] || "gray"}
                              size="sm"
                            >
                              {TYPE_LABELS[t.type] || t.type}
                            </Badge>
                          ))}
                          {company.searchTypes.map((st) => (
                            <Badge
                              key={st.searchType.id}
                              variant="purple"
                              size="sm"
                            >
                              {st.searchType.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-navy-400 whitespace-nowrap ml-2">
                        {company.contacts.length} contact
                        {company.contacts.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="Aucun contact indépendant"
            description="Les contacts indépendants ne sont rattachés à aucune société"
            action={
              <Button size="sm" onClick={() => setShowContactModal(true)}>
                <Plus className="w-4 h-4" /> Ajouter un contact
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop table contacts */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-100">
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Nom
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Recherche
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Email
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Téléphone
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className={`hover:bg-navy-50/50 transition-colors ${contact.isHidden ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="font-medium text-navy-900 hover:text-primary-600 transition-colors"
                          >
                            {contact.firstName} {contact.lastName || ""}
                          </Link>
                          {contact.isHidden && (
                            <Badge variant="red" size="sm">
                              <EyeOff className="w-3 h-3" /> Caché
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {contact.searchTypes.map((st) => (
                            <Badge
                              key={st.searchType.id}
                              variant="purple"
                              size="sm"
                            >
                              {st.searchType.label}
                            </Badge>
                          ))}
                          {contact.searchTypes.length === 0 && (
                            <span className="text-sm text-navy-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-600">
                        {contact.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-600">
                        {contact.phone || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards contacts */}
            <div className="md:hidden divide-y divide-navy-100">
              {contacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className={`block px-4 py-3 hover:bg-navy-50/50 transition-colors ${contact.isHidden ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-navy-900">
                      {contact.firstName} {contact.lastName || ""}
                    </p>
                    {contact.isHidden && (
                      <Badge variant="red" size="sm">Caché</Badge>
                    )}
                  </div>
                  <p className="text-sm text-navy-500 mt-0.5">
                    {contact.email || contact.phone}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-navy-100">
            <p className="text-sm text-navy-500">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateCompanyModal
        isOpen={showCompanyModal}
        onClose={() => {
          setShowCompanyModal(false);
          fetchSearchTypes();
        }}
      />
      <CreateContactModal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          fetchSearchTypes();
        }}
      />
    </div>
  );
}
