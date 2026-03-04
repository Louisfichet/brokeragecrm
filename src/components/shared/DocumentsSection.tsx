"use client";

import { useState, useRef } from "react";
import { FileText, Plus, Download, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";

interface Document {
  id: string;
  title: string;
  note: string | null;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

interface DocumentsSectionProps {
  documents: Document[];
  apiBase: string; // ex: /api/companies/xxx/documents
  isAdmin: boolean;
  onRefresh: () => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function DocumentsSection({
  documents,
  apiBase,
  isAdmin,
  onRefresh,
}: DocumentsSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      if (note) formData.append("note", note);

      await fetch(apiBase, { method: "POST", body: formData });

      setShowModal(false);
      setTitle("");
      setNote("");
      setFile(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      await fetch(`${apiBase}/${docId}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
        <h3 className="font-semibold text-navy-900">Documents</h3>
        <Button size="sm" variant="secondary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun document" />
      ) : (
        <div className="divide-y divide-navy-50">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-navy-400 flex-shrink-0" />
                  <p className="font-medium text-navy-900 text-sm truncate">
                    {doc.title}
                  </p>
                </div>
                <p className="text-xs text-navy-400 mt-0.5 ml-6">
                  {doc.fileName} {doc.size ? `· ${formatFileSize(doc.size)}` : ""}
                </p>
                {doc.note && (
                  <p className="text-xs text-navy-500 mt-1 ml-6">{doc.note}</p>
                )}
              </div>
              <div className="flex gap-1 ml-3 flex-shrink-0">
                <a
                  href={doc.filePath}
                  download={doc.fileName}
                  className="p-1.5 rounded-lg text-navy-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Ajouter un document"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Titre *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du document"
          />
          <Input
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note optionnelle..."
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-navy-700">
              Fichier *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-navy-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-navy-200 file:text-sm file:font-medium file:bg-white file:text-navy-700 hover:file:bg-navy-50 file:cursor-pointer file:transition-colors"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={loading} disabled={!file || !title}>
              Uploader
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
