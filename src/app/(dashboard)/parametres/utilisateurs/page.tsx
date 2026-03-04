"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  UserCheck,
  UserX,
  Pencil,
  Shield,
  Users,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "FREELANCE";
  isActive: boolean;
  createdAt: string;
  _count: { propertiesCreated: number };
}

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // Redirect si pas admin
  useEffect(() => {
    if (session && session.user?.role !== "ADMIN") {
      router.push("/biens");
    }
  }, [session, router]);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/users?${params}`);
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleActive = async (user: User) => {
    const action = user.isActive ? "désactiver" : "réactiver";
    if (!confirm(`Voulez-vous ${action} le compte de ${user.name} ?`)) return;

    await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    fetchUsers();
  };

  const toggleRole = async (user: User) => {
    const newRole = user.role === "ADMIN" ? "FREELANCE" : "ADMIN";
    const label = newRole === "ADMIN" ? "administrateur" : "freelance";
    if (!confirm(`Passer ${user.name} en ${label} ?`)) return;

    await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  };

  if (session?.user?.role !== "ADMIN") return null;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Utilisateurs</h1>
          <p className="text-navy-500 text-sm mt-1">
            Gestion des comptes utilisateurs
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
        {/* Search */}
        <div className="p-4 border-b border-navy-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun utilisateur"
            description="Aucun utilisateur trouvé"
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-100">
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Nom
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Email
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Rôle
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Statut
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Biens créés
                    </th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Créé le
                    </th>
                    <th className="text-right text-xs font-medium text-navy-500 uppercase tracking-wider px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className={`transition-colors ${
                        user.isActive
                          ? "hover:bg-navy-50/50"
                          : "bg-navy-50/30 opacity-60"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-navy-900 text-sm">
                          {user.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-600">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={user.role === "ADMIN" ? "blue" : "gray"}
                          size="sm"
                        >
                          {user.role === "ADMIN" ? "Admin" : "Freelance"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={user.isActive ? "green" : "red"}
                          size="sm"
                        >
                          {user.isActive ? "Actif" : "Désactivé"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-600">
                        {user._count.propertiesCreated}
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-500">
                        {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditUser(user)}
                            className="p-2 rounded-lg text-navy-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleRole(user)}
                            className="p-2 rounded-lg text-navy-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title={user.role === "ADMIN" ? "Passer en Freelance" : "Passer en Admin"}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.isActive
                                ? "text-navy-400 hover:text-red-600 hover:bg-red-50"
                                : "text-navy-400 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={user.isActive ? "Désactiver" : "Réactiver"}
                          >
                            {user.isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-navy-100">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`px-4 py-3 ${!user.isActive ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-900 text-sm">
                        {user.name}
                      </p>
                      <p className="text-xs text-navy-500 mt-0.5">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                          variant={user.role === "ADMIN" ? "blue" : "gray"}
                          size="sm"
                        >
                          {user.role === "ADMIN" ? "Admin" : "Freelance"}
                        </Badge>
                        <Badge
                          variant={user.isActive ? "green" : "red"}
                          size="sm"
                        >
                          {user.isActive ? "Actif" : "Désactivé"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditUser(user)}
                        className="p-2 rounded-lg text-navy-400 hover:text-primary-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        className="p-2 rounded-lg text-navy-400 transition-colors"
                      >
                        {user.isActive ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal création */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchUsers();
        }}
      />

      {/* Modal édition */}
      <EditUserModal
        user={editUser}
        onClose={() => setEditUser(null)}
        onSuccess={() => {
          setEditUser(null);
          fetchUsers();
        }}
      />
    </div>
  );
}

// ==========================================
// CREATE USER MODAL
// ==========================================
function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "FREELANCE",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erreur lors de la création");
      setLoading(false);
      return;
    }

    setForm({ name: "", email: "", password: "", role: "FREELANCE" });
    setLoading(false);
    onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvel utilisateur">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}
        <Input
          label="Nom *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Jean Dupont"
        />
        <Input
          label="Email *"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="jean@crmbrokerage.fr"
        />
        <Input
          label="Mot de passe *"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Minimum 6 caractères"
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-navy-700">
            Rôle
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
          >
            <option value="FREELANCE">Freelance</option>
            <option value="ADMIN">Administrateur</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            Créer
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ==========================================
// EDIT USER MODAL
// ==========================================
function EditUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, password: "" });
      setError("");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setLoading(true);

    const body: Record<string, string> = {
      name: form.name,
      email: form.email,
    };
    if (form.password) body.password = form.password;

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erreur lors de la modification");
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <Modal
      isOpen={!!user}
      onClose={onClose}
      title="Modifier l'utilisateur"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}
        <Input
          label="Nom *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Email *"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Nouveau mot de passe"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Laisser vide pour ne pas changer"
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
