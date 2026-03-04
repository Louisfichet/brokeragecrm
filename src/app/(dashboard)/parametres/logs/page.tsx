"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  ScrollText,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

interface LogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  entityLabel: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string };
}

const ACTION_LABELS: Record<string, { label: string; variant: "green" | "blue" | "red" | "orange" }> = {
  CREATE: { label: "Création", variant: "green" },
  UPDATE: { label: "Modification", variant: "blue" },
  DELETE: { label: "Suppression", variant: "red" },
  GENERATE: { label: "Génération", variant: "orange" },
};

const ENTITY_LABELS: Record<string, string> = {
  COMPANY: "Société",
  CONTACT: "Contact",
  PROPERTY: "Bien",
  DOCUMENT: "Document",
  USER: "Utilisateur",
  SETTINGS: "Paramètres",
};

const ENTITY_OPTIONS = [
  { value: "", label: "Toutes les entités" },
  { value: "COMPANY", label: "Sociétés" },
  { value: "CONTACT", label: "Contacts" },
  { value: "PROPERTY", label: "Biens" },
  { value: "DOCUMENT", label: "Documents" },
  { value: "USER", label: "Utilisateurs" },
  { value: "SETTINGS", label: "Paramètres" },
];

const ACTION_OPTIONS = [
  { value: "", label: "Toutes les actions" },
  { value: "CREATE", label: "Création" },
  { value: "UPDATE", label: "Modification" },
  { value: "DELETE", label: "Suppression" },
  { value: "GENERATE", label: "Génération" },
];

export default function LogsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  // Admin check
  useEffect(() => {
    if (session && session.user?.role !== "ADMIN") {
      router.push("/biens");
    }
  }, [session, router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "30",
      });
      if (entityFilter) params.set("entity", entityFilter);
      if (actionFilter) params.set("action", actionFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, actionFilter, search]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchLogs();
    }
  }, [fetchLogs, session]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [entityFilter, actionFilter, search]);

  if (session?.user?.role !== "ADMIN") return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-navy-900">
          Journal d&apos;activité
        </h2>
        <p className="text-sm text-navy-500">
          {total} action{total > 1 ? "s" : ""} enregistrée{total > 1 ? "s" : ""}
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-navy-200 bg-white text-sm text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-400" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-navy-200 bg-white text-sm text-navy-700 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
            >
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-navy-200 bg-white text-sm text-navy-700 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Aucune activité"
          description="Les actions effectuées dans le CRM apparaîtront ici"
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden sm:block bg-white rounded-2xl border border-navy-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-navy-500 uppercase">
                    Date
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-navy-500 uppercase">
                    Utilisateur
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-navy-500 uppercase">
                    Action
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-navy-500 uppercase">
                    Entité
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-navy-500 uppercase">
                    Élément
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {logs.map((log) => {
                  const actionInfo = ACTION_LABELS[log.action] || {
                    label: log.action,
                    variant: "gray" as const,
                  };
                  return (
                    <tr key={log.id} className="hover:bg-navy-50/50 transition-colors">
                      <td className="px-5 py-3 text-xs text-navy-500 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-sm text-navy-900">
                        {log.user.name}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={actionInfo.variant} size="sm">
                          {actionInfo.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-sm text-navy-600">
                        {ENTITY_LABELS[log.entity] || log.entity}
                      </td>
                      <td className="px-5 py-3 text-sm text-navy-900 font-medium">
                        {log.entityLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-3">
            {logs.map((log) => {
              const actionInfo = ACTION_LABELS[log.action] || {
                label: log.action,
                variant: "gray" as const,
              };
              return (
                <div
                  key={log.id}
                  className="bg-white rounded-xl border border-navy-100 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={actionInfo.variant} size="sm">
                      {actionInfo.label}
                    </Badge>
                    <span className="text-xs text-navy-400">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-navy-900">
                    {log.entityLabel}
                  </p>
                  <div className="flex items-center justify-between text-xs text-navy-500">
                    <span>{ENTITY_LABELS[log.entity] || log.entity}</span>
                    <span>{log.user.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
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
  );
}
