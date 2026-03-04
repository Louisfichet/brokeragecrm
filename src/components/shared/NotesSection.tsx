"use client";

import { useState } from "react";
import { StickyNote, Plus, Pencil, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import EmptyState from "@/components/ui/EmptyState";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface NotesSectionProps {
  notes: Note[];
  apiBase: string; // ex: /api/companies/xxx/notes
  isAdmin: boolean;
  onRefresh: () => void;
}

export default function NotesSection({
  notes,
  apiBase,
  isAdmin,
  onRefresh,
}: NotesSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);

  const openCreate = () => {
    setEditNote(null);
    setForm({ title: "", content: "" });
    setShowModal(true);
  };

  const openEdit = (note: Note) => {
    setEditNote(note);
    setForm({ title: note.title, content: note.content });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editNote ? `${apiBase}/${editNote.id}` : apiBase;
      const method = editNote ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      setShowModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Supprimer cette note ?")) return;
    try {
      await fetch(`${apiBase}/${noteId}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
        <h3 className="font-semibold text-navy-900">Notes</h3>
        <Button size="sm" variant="secondary" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="Aucune note" />
      ) : (
        <div className="divide-y divide-navy-50">
          {notes.map((note) => (
            <div key={note.id} className="px-5 py-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-navy-900 text-sm">
                    {note.title}
                  </h4>
                  <p className="text-sm text-navy-600 mt-1 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <p className="text-xs text-navy-400 mt-2">
                    {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex gap-1 ml-3 flex-shrink-0">
                  <button
                    onClick={() => openEdit(note)}
                    className="p-1.5 rounded-lg text-navy-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editNote ? "Modifier la note" : "Nouvelle note"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Titre *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Titre de la note"
          />
          <Textarea
            label="Contenu *"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Contenu de la note..."
            rows={5}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              {editNote ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
