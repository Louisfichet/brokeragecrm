"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import DocumentWizard from "@/components/documents/DocumentWizard";

interface DocumentItem {
  id: string;
  reference: string;
  type: string;
  status: string;
  companyId: string | null;
  company: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  property: { id: string; reference: string; address: string } | null;
  createdBy: { name: string };
  pdfPath: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  NDA_TYPE1: "NDA — Parkto divulgue",
  NDA_TYPE2: "NDA — Autre divulgue",
  INTERCAB: "Intercab",
  MANDAT: "Mandat de recherche",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "gray" | "blue" | "orange" | "green" | "red" }
> = {
  DRAFT: { label: "Brouillon", variant: "gray" },
  GENERATED: { label: "Généré", variant: "blue" },
  SENT: { label: "Envoyé", variant: "orange" },
  SIGNED: { label: "Signé", variant: "green" },
  EXPIRED: { label: "Expiré", variant: "red" },
};

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isAdmin = session?.user?.role === "ADMIN";
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleGenerate = async (doc: DocumentItem) => {
    setGeneratingId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de la génération du PDF");
        return;
      }
      // Ouvrir le PDF dans un nouvel onglet
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Rafraîchir la liste pour mettre à jour le statut
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setGeneratingId(null);
    }
  };

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      params.set("page", String(page));

      const res = await fetch(`/api/documents?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterStatus, page]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (doc: DocumentItem) => {
    if (
      !confirm(
        `Supprimer le document ${doc.reference} ? Cette action est irréversible.`
      )
    )
      return;

    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    fetchDocuments();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Documents</h1>
          <p className="text-navy-500 text-sm mt-1">
            Générez et suivez vos documents juridiques
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="w-4 h-4" />
          Nouveau document
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par référence ou société..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="pl-10 pr-8 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
            >
              <option value="">Tous les types</option>
              <option value="NDA_TYPE1">NDA — Parkto divulgue</option>
              <option value="NDA_TYPE2">NDA — Autre divulgue</option>
              <option value="INTERCAB">Intercab</option>
              <option value="MANDAT">Mandat de recherche</option>
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            <option value="DRAFT">Brouillon</option>
            <option value="GENERATED">Généré</option>
            <option value="SENT">Envoyé</option>
            <option value="SIGNED">Signé</option>
            <option value="EXPIRED">Expiré</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun document"
          description="Créez votre premier document en cliquant sur 'Nouveau document'."
        />
      ) : (
        <>
          {/* Table desktop */}
          <div className="hidden md:block bg-white rounded-2xl border border-navy-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-navy-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">
                    Contrepartie
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {documents.map((doc) => {
                  const statusConf = STATUS_CONFIG[doc.status] || {
                    label: doc.status,
                    variant: "gray" as const,
                  };
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-navy-50/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium text-navy-900">
                          {doc.reference}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-navy-700">
                          {TYPE_LABELS[doc.type] || doc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-navy-700">
                          {doc.contact
                            ? `${doc.contact.firstName} ${doc.contact.lastName || ""}`
                            : doc.company?.name || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-navy-500">
                          {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConf.variant}>
                          {statusConf.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleGenerate(doc)}
                            disabled={generatingId === doc.id}
                            title={doc.pdfPath ? "Régénérer et voir le PDF" : "Générer le PDF"}
                            className="p-1.5 hover:bg-navy-100 rounded-lg transition-colors text-navy-400 hover:text-primary-600 disabled:opacity-50"
                          >
                            {generatingId === doc.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          {doc.pdfPath && (
                            <a
                              href={`/api${doc.pdfPath}`}
                              download
                              title="Télécharger PDF"
                              className="p-1.5 hover:bg-navy-100 rounded-lg transition-colors text-navy-400 hover:text-navy-700"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(doc)}
                              title="Supprimer"
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-navy-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="md:hidden space-y-3">
            {documents.map((doc) => {
              const statusConf = STATUS_CONFIG[doc.status] || {
                label: doc.status,
                variant: "gray" as const,
              };
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-navy-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-mono font-medium text-navy-900 truncate">
                        {doc.reference}
                      </p>
                      <p className="text-xs text-navy-500 mt-0.5">
                        {TYPE_LABELS[doc.type] || doc.type}
                      </p>
                    </div>
                    <Badge variant={statusConf.variant}>
                      {statusConf.label}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-navy-600">
                      {doc.contact
                        ? `${doc.contact.firstName} ${doc.contact.lastName || ""}`
                        : doc.company?.name}
                    </span>
                    <span className="text-xs text-navy-400">
                      {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleGenerate(doc)}
                      disabled={generatingId === doc.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50"
                    >
                      {generatingId === doc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      {doc.pdfPath ? "Voir PDF" : "Générer PDF"}
                    </button>
                    {doc.pdfPath && (
                      <a
                        href={`/api${doc.pdfPath}`}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-navy-50 text-navy-700 hover:bg-navy-100 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Télécharger
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-navy-500">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Wizard modal */}
      {showWizard && (
        <DocumentWizard
          onClose={() => setShowWizard(false)}
          onCreated={() => {
            setShowWizard(false);
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
}
