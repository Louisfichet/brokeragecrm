"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Plus,
  Search,
  List,
  MapIcon,
  ChevronLeft,
  ChevronRight,
  Home,
  EyeOff,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import CreatePropertyModal from "@/components/properties/CreatePropertyModal";

const PropertyMap = dynamic(
  () => import("@/components/properties/PropertyMap"),
  { ssr: false, loading: () => (
    <div className="w-full h-[600px] rounded-xl bg-navy-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )}
);

interface Property {
  id: string;
  reference: string;
  address: string;
  city: string | null;
  postalCode: string | null;
  lat: number | null;
  lng: number | null;
  propertyType: string | null;
  rentHT: number | null;
  rentPeriod: "MENSUEL" | "ANNUEL" | null;
  priceFAI: number | null;
  isHidden: boolean;
  createdAt: string;
  createdBy: { name: string };
  apportedByCompany: { id: string; name: string } | null;
  apportedByContact: { id: string; firstName: string; lastName: string | null } | null;
  _count: { proposals: number };
}

type ViewMode = "list" | "map";

export default function BiensPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [properties, setProperties] = useState<Property[]>([]);
  const [mapProperties, setMapProperties] = useState<Property[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
      });
      const res = await fetch(`/api/properties?${params}`);
      const data = await res.json();
      setProperties(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchMap = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        all: "true",
        ...(search && { search }),
      });
      const res = await fetch(`/api/properties?${params}`);
      const data = await res.json();
      setMapProperties(data.data);
    } catch (err) {
      console.error(err);
    }
  }, [search]);

  useEffect(() => {
    if (viewMode === "list") {
      fetchList();
    } else {
      fetchMap();
    }
  }, [viewMode, fetchList, fetchMap]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const getApporteurName = (p: Property) => {
    if (p.apportedByCompany) return p.apportedByCompany.name;
    if (p.apportedByContact)
      return `${p.apportedByContact.firstName} ${p.apportedByContact.lastName || ""}`.trim();
    return "—";
  };

  const getRentability = (p: Property) => {
    if (!p.rentHT || !p.priceFAI || p.priceFAI === 0) return null;
    const annual = p.rentPeriod === "MENSUEL" ? p.rentHT * 12 : p.rentHT;
    return ((annual / p.priceFAI) * 100).toFixed(2);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Biens</h1>
          <p className="text-navy-500 text-sm mt-1">
            Gestion des biens immobiliers
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" /> Ajouter un bien
        </Button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-navy-100">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              placeholder="Rechercher par référence, adresse, ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>

          {/* View toggle */}
          <div className="flex rounded-xl border border-navy-200 overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-primary-500 text-white"
                  : "bg-white text-navy-600 hover:bg-navy-50"
              }`}
            >
              <List className="w-4 h-4" /> Liste
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                viewMode === "map"
                  ? "bg-primary-500 text-white"
                  : "bg-white text-navy-600 hover:bg-navy-50"
              }`}
            >
              <MapIcon className="w-4 h-4" /> Carte
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === "map" ? (
          <div className="p-4">
            {mapProperties.length === 0 ? (
              <EmptyState
                icon={MapIcon}
                title="Aucun bien géolocalisé"
                description="Ajoutez des biens avec une adresse pour les voir sur la carte"
              />
            ) : (
              <PropertyMap properties={mapProperties as never} />
            )}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            icon={Home}
            title="Aucun bien"
            description="Commencez par ajouter votre premier bien immobilier"
            action={
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4" /> Ajouter un bien
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
                      Référence
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Type
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Adresse
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Ville
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Rentabilité
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Apporteur
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Propositions
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {properties.map((property) => {
                    const rent = getRentability(property);
                    return (
                      <tr
                        key={property.id}
                        className={`hover:bg-navy-50/50 transition-colors ${property.isHidden ? "opacity-50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/biens/${property.id}`}
                              className="font-semibold text-primary-600 hover:text-primary-700 text-sm"
                            >
                              {property.reference}
                            </Link>
                            {property.isHidden && (
                              <Badge variant="red" size="sm">
                                <EyeOff className="w-3 h-3" /> Caché
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-navy-600">
                          {property.propertyType || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-navy-700 max-w-[200px] truncate">
                          {property.address}
                        </td>
                        <td className="px-4 py-3 text-sm text-navy-600">
                          {property.city || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {rent ? (
                            <span className="font-semibold text-emerald-600">
                              {rent}%
                            </span>
                          ) : (
                            <span className="text-navy-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-navy-600">
                          {getApporteurName(property)}
                        </td>
                        <td className="px-4 py-3 text-sm text-navy-600">
                          {property._count.proposals}
                        </td>
                        <td className="px-4 py-3 text-sm text-navy-500">
                          {new Date(property.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-navy-100">
              {properties.map((property) => {
                const rent = getRentability(property);
                return (
                  <Link
                    key={property.id}
                    href={`/biens/${property.id}`}
                    className={`block px-4 py-3 hover:bg-navy-50/50 transition-colors ${property.isHidden ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-primary-600 text-sm">
                            {property.reference}
                          </p>
                          {property.isHidden && (
                            <Badge variant="red" size="sm">Caché</Badge>
                          )}
                          {property.propertyType && (
                            <span className="text-xs text-navy-400">
                              {property.propertyType}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-navy-700 truncate mt-0.5">
                          {property.address}
                        </p>
                        <p className="text-xs text-navy-500 mt-1">
                          {getApporteurName(property)}
                          {rent && (
                            <span className="text-emerald-600 font-medium"> · {rent}%</span>
                          )}
                          {" · "}{property._count.proposals} proposition
                          {property._count.proposals > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

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
          </>
        )}
      </div>

      <CreatePropertyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
