"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Folder,
  FolderPlus,
  FileText,
  Upload,
  Download,
  Trash2,
  ChevronRight,
  Home,
  MoreVertical,
  Pencil,
  ArrowLeft,
  File,
  FileImage,
  FileSpreadsheet,
  X,
  Check,
  FolderOpen,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

// ─── Types ──────────────────────────────────────────────────────
interface DocumentItem {
  id: string;
  title: string;
  note: string | null;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  size: number | null;
  folderId: string | null;
  createdAt: string;
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  _count: {
    children: number;
    propertyDocuments: number;
    companyDocuments: number;
    contactDocuments: number;
  };
}

type EntityType = "PROPERTY" | "COMPANY" | "CONTACT";

interface FileManagerProps {
  documents: DocumentItem[];
  entityType: EntityType;
  entityId: string;
  apiBase: string; // ex: /api/properties/xxx/documents
  isAdmin: boolean;
  onRefresh: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────
function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("csv"))
    return FileSpreadsheet;
  return File;
}

function getFileIconColor(mimeType: string | null): string {
  if (!mimeType) return "text-navy-400";
  if (mimeType.startsWith("image/")) return "text-emerald-500";
  if (mimeType.includes("pdf")) return "text-red-500";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "text-green-600";
  if (mimeType.includes("word") || mimeType.includes("document")) return "text-blue-600";
  return "text-navy-400";
}

// ─── Component ──────────────────────────────────────────────────
export default function FileManager({
  documents,
  entityType,
  entityId,
  apiBase,
  isAdmin,
  onRefresh,
}: FileManagerProps) {
  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Documents" },
  ]);

  // Folders
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // UI state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ id: string; type: "folder" | "file"; x: number; y: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "folder" | "file"; name: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // ─── Fetch folders ──────────────────────────────────────────
  const fetchFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const parentParam = currentFolderId ? `&parentId=${currentFolderId}` : "";
      const res = await fetch(
        `/api/folders?entityType=${entityType}&entityId=${entityId}${parentParam}`
      );
      if (res.ok) {
        setFolders(await res.json());
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
    } finally {
      setLoadingFolders(false);
    }
  }, [entityType, entityId, currentFolderId]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Close context menu on click outside
  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  // ─── Current folder documents ──────────────────────────────
  const currentDocuments = documents.filter((d) => d.folderId === currentFolderId);

  const folderDocCount = (folderId: string) => {
    const countKey =
      entityType === "PROPERTY"
        ? "propertyDocuments"
        : entityType === "COMPANY"
          ? "companyDocuments"
          : "contactDocuments";
    const folder = folders.find((f) => f.id === folderId);
    return folder ? folder._count[countKey] + folder._count.children : 0;
  };

  // ─── Navigate to folder ────────────────────────────────────
  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const target = breadcrumbs[index];
    setCurrentFolderId(target.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  // ─── Create folder ────────────────────────────────────────
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          entityType,
          entityId,
          parentId: currentFolderId,
        }),
      });
      setNewFolderName("");
      setShowNewFolder(false);
      fetchFolders();
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Rename folder ────────────────────────────────────────
  const renameFolder = async (folderId: string) => {
    if (!renameValue.trim()) return;
    try {
      await fetch(`/api/folders/${folderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      setRenamingFolder(null);
      setRenameValue("");
      fetchFolders();
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Delete folder ────────────────────────────────────────
  const deleteFolder = async (folderId: string) => {
    try {
      await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
      setDeleteConfirm(null);
      fetchFolders();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Delete document ──────────────────────────────────────
  const deleteDocument = async (docId: string) => {
    try {
      await fetch(`${apiBase}/${docId}`, { method: "DELETE" });
      setDeleteConfirm(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Upload files ─────────────────────────────────────────
  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.size > 0);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      // Upload par batch de 5
      const batchSize = 5;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const formData = new FormData();
        batch.forEach((f) => formData.append("files", f));
        if (currentFolderId) formData.append("folderId", currentFolderId);

        await fetch(apiBase, { method: "POST", body: formData });
        setUploadProgress({ current: Math.min(i + batchSize, files.length), total: files.length });
      }
      onRefresh();
      fetchFolders();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  // ─── Upload directory (webkitdirectory) ───────────────────
  const uploadDirectory = async (entries: FileSystemEntry[]) => {
    // Recursively collect all files with their relative paths
    const allFiles: { file: File; relativePath: string }[] = [];

    const readEntry = (entry: FileSystemEntry, basePath: string): Promise<void> => {
      return new Promise((resolve) => {
        if (entry.isFile) {
          (entry as FileSystemFileEntry).file((file) => {
            allFiles.push({ file, relativePath: basePath });
            resolve();
          });
        } else if (entry.isDirectory) {
          const reader = (entry as FileSystemDirectoryEntry).createReader();
          reader.readEntries(async (entries) => {
            for (const e of entries) {
              await readEntry(e, `${basePath}/${e.name}`);
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    };

    // Collect folder structure from entries
    const folderPaths = new Set<string>();
    const collectStructure = (entry: FileSystemEntry, basePath: string): Promise<void> => {
      return new Promise((resolve) => {
        if (entry.isDirectory) {
          folderPaths.add(basePath);
          const reader = (entry as FileSystemDirectoryEntry).createReader();
          reader.readEntries(async (entries) => {
            for (const e of entries) {
              await collectStructure(e, `${basePath}/${e.name}`);
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    };

    setUploading(true);

    try {
      // First, collect structure
      for (const entry of entries) {
        if (entry.isDirectory) {
          await collectStructure(entry, entry.name);
          await readEntry(entry, entry.name);
        } else {
          await readEntry(entry, "");
        }
      }

      // Create folders in order (sorted by depth)
      const sortedPaths = Array.from(folderPaths).sort(
        (a, b) => a.split("/").length - b.split("/").length
      );

      const folderIdMap: Record<string, string> = {};

      for (const folderPath of sortedPaths) {
        const parts = folderPath.split("/");
        const name = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join("/");
        const parentId = parentPath ? folderIdMap[parentPath] : currentFolderId;

        const res = await fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            entityType,
            entityId,
            parentId: parentId || null,
          }),
        });
        const folder = await res.json();
        folderIdMap[folderPath] = folder.id;
      }

      // Upload files into their respective folders
      setUploadProgress({ current: 0, total: allFiles.length });

      const batchSize = 5;
      // Group by folder path
      const filesByFolder = new Map<string, File[]>();
      for (const { file, relativePath } of allFiles) {
        const parts = relativePath.split("/");
        const folderPath = parts.slice(0, -1).join("/");
        if (!filesByFolder.has(folderPath)) filesByFolder.set(folderPath, []);
        filesByFolder.get(folderPath)!.push(file);
      }

      let uploaded = 0;
      const folderEntries = Array.from(filesByFolder.entries());
      for (const [folderPath, files] of folderEntries) {
        const folderId = folderPath ? folderIdMap[folderPath] : currentFolderId;
        for (let i = 0; i < files.length; i += batchSize) {
          const batch = files.slice(i, i + batchSize);
          const formData = new FormData();
          batch.forEach((f: File) => formData.append("files", f));
          if (folderId) formData.append("folderId", folderId);
          await fetch(apiBase, { method: "POST", body: formData });
          uploaded += batch.length;
          setUploadProgress({ current: uploaded, total: allFiles.length });
        }
      }

      fetchFolders();
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  // ─── Drag & Drop handlers ────────────────────────────────
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only leave if we're actually leaving the drop zone
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    if (!items) return;

    // Check if any entry is a directory
    const entries: FileSystemEntry[] = [];
    let hasDirectory = false;

    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry?.();
      if (entry) {
        entries.push(entry);
        if (entry.isDirectory) hasDirectory = true;
      }
    }

    if (hasDirectory) {
      await uploadDirectory(entries);
    } else {
      // Just files
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await uploadFiles(files);
      }
    }
  };

  // ─── Context menu handler ─────────────────────────────────
  const handleContextMenu = (
    e: React.MouseEvent,
    id: string,
    type: "folder" | "file"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id, type, x: e.clientX, y: e.clientY });
  };

  // ─── Render ───────────────────────────────────────────────
  const isEmpty = folders.length === 0 && currentDocuments.length === 0;

  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
        <div className="flex items-center gap-2 min-w-0">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm min-w-0 overflow-x-auto">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.id ?? "root"} className="flex items-center gap-1 shrink-0">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-navy-300" />}
                <button
                  onClick={() => navigateToBreadcrumb(i)}
                  className={`hover:text-primary-600 transition-colors whitespace-nowrap ${
                    i === breadcrumbs.length - 1
                      ? "font-semibold text-navy-900"
                      : "text-navy-500"
                  }`}
                >
                  {i === 0 ? (
                    <span className="flex items-center gap-1.5">
                      <Home className="w-4 h-4" />
                      <span className="hidden sm:inline">Documents</span>
                    </span>
                  ) : (
                    crumb.name
                  )}
                </button>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowNewFolder(true);
              setTimeout(() => newFolderInputRef.current?.focus(), 50);
            }}
            title="Nouveau dossier"
          >
            <FolderPlus className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importer</span>
          </Button>
        </div>
      </div>

      {/* Upload progress bar */}
      {uploadProgress && (
        <div className="px-5 py-2 bg-primary-50 border-b border-primary-100">
          <div className="flex items-center justify-between text-xs text-primary-700 mb-1">
            <span>Upload en cours...</span>
            <span>
              {uploadProgress.current}/{uploadProgress.total} fichiers
            </span>
          </div>
          <div className="h-1.5 bg-primary-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{
                width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Drop zone + content */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative transition-colors min-h-[200px] ${
          isDragOver ? "bg-primary-50/70" : ""
        }`}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center border-2 border-dashed border-primary-400 rounded-b-2xl bg-primary-50/80 pointer-events-none">
            <Upload className="w-10 h-10 text-primary-500 mb-2" />
            <p className="text-sm font-medium text-primary-700">
              Déposez vos fichiers ou dossiers ici
            </p>
            <p className="text-xs text-primary-500 mt-1">
              Les dossiers seront recréés automatiquement
            </p>
          </div>
        )}

        {/* New folder inline */}
        {showNewFolder && (
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-navy-100 bg-navy-50/30">
            <Folder className="w-5 h-5 text-amber-500 shrink-0" />
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createFolder();
                if (e.key === "Escape") {
                  setShowNewFolder(false);
                  setNewFolderName("");
                }
              }}
              placeholder="Nom du dossier..."
              className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border border-navy-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={createFolder}
              className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName("");
              }}
              className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Go back row */}
        {currentFolderId && (
          <button
            onClick={() => navigateToBreadcrumb(breadcrumbs.length - 2)}
            className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-navy-500 hover:bg-navy-50/50 transition-colors border-b border-navy-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
        )}

        {/* Folders */}
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="group flex items-center gap-3 px-5 py-2.5 hover:bg-navy-50/50 transition-colors border-b border-navy-50 cursor-pointer"
            onClick={() => {
              if (renamingFolder !== folder.id) {
                navigateToFolder(folder.id, folder.name);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, folder.id, "folder")}
          >
            <FolderOpen className="w-5 h-5 text-amber-500 shrink-0" />

            {renamingFolder === folder.id ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") renameFolder(folder.id);
                  if (e.key === "Escape") {
                    setRenamingFolder(null);
                    setRenameValue("");
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 text-sm px-2 py-1 rounded-lg border border-primary-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            ) : (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy-900 truncate">
                  {folder.name}
                </p>
                <p className="text-xs text-navy-400">
                  {folder._count.children > 0 && `${folder._count.children} dossier${folder._count.children > 1 ? "s" : ""}`}
                  {folder._count.children > 0 && folderDocCount(folder.id) > 0 && " · "}
                  {folderDocCount(folder.id) > 0 && `${folderDocCount(folder.id)} élément${folderDocCount(folder.id) > 1 ? "s" : ""}`}
                </p>
              </div>
            )}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenamingFolder(folder.id);
                  setRenameValue(folder.name);
                  setTimeout(() => renameInputRef.current?.focus(), 50);
                }}
                className="p-1.5 rounded-lg text-navy-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title="Renommer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm({ id: folder.id, type: "folder", name: folder.name });
                  }}
                  className="p-1.5 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronRight className="w-4 h-4 text-navy-300" />
            </div>
          </div>
        ))}

        {/* Files */}
        {currentDocuments.map((doc) => {
          const IconComponent = getFileIcon(doc.mimeType);
          const iconColor = getFileIconColor(doc.mimeType);

          return (
            <div
              key={doc.id}
              className="group flex items-center gap-3 px-5 py-2.5 hover:bg-navy-50/50 transition-colors border-b border-navy-50"
              onContextMenu={(e) => handleContextMenu(e, doc.id, "file")}
            >
              <IconComponent className={`w-5 h-5 ${iconColor} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy-900 truncate">
                  {doc.title}
                </p>
                <p className="text-xs text-navy-400">
                  {doc.fileName}
                  {doc.size ? ` · ${formatFileSize(doc.size)}` : ""}
                  {" · "}
                  {new Date(doc.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <a
                  href={doc.filePath}
                  download={doc.fileName}
                  className="p-1.5 rounded-lg text-navy-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  title="Télécharger"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                {isAdmin && (
                  <button
                    onClick={() =>
                      setDeleteConfirm({ id: doc.id, type: "file", name: doc.title })
                    }
                    className="p-1.5 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {isEmpty && !showNewFolder && !loadingFolders && (
          <div
            className="flex flex-col items-center justify-center py-12 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mb-3">
              <Upload className="w-7 h-7 text-navy-300" />
            </div>
            <p className="text-sm font-medium text-navy-600">
              Glissez-déposez vos fichiers ici
            </p>
            <p className="text-xs text-navy-400 mt-1">
              ou cliquez pour sélectionner · Dossiers supportés
            </p>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white rounded-xl border border-navy-200 shadow-lg py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === "folder" && (
            <button
              onClick={() => {
                const folder = folders.find((f) => f.id === contextMenu.id);
                if (folder) {
                  setRenamingFolder(folder.id);
                  setRenameValue(folder.name);
                }
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-sm text-left text-navy-700 hover:bg-navy-50 flex items-center gap-2"
            >
              <Pencil className="w-3.5 h-3.5" /> Renommer
            </button>
          )}
          {contextMenu.type === "file" && (
            <a
              href={documents.find((d) => d.id === contextMenu.id)?.filePath}
              download
              onClick={() => setContextMenu(null)}
              className="w-full px-3 py-2 text-sm text-left text-navy-700 hover:bg-navy-50 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> Télécharger
            </a>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                const name =
                  contextMenu.type === "folder"
                    ? folders.find((f) => f.id === contextMenu.id)?.name || ""
                    : documents.find((d) => d.id === contextMenu.id)?.title || "";
                setDeleteConfirm({ id: contextMenu.id, type: contextMenu.type, name });
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-navy-600">
            Êtes-vous sûr de vouloir supprimer{" "}
            {deleteConfirm?.type === "folder" ? "le dossier" : "le fichier"}{" "}
            <strong className="text-navy-900">{deleteConfirm?.name}</strong> ?
            {deleteConfirm?.type === "folder" && (
              <span className="block mt-1 text-red-600">
                Les sous-dossiers seront aussi supprimés. Les fichiers seront déplacés à la racine.
              </span>
            )}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (!deleteConfirm) return;
                if (deleteConfirm.type === "folder") deleteFolder(deleteConfirm.id);
                else deleteDocument(deleteConfirm.id);
              }}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
