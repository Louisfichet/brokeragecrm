"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Save,
  Upload,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Stamp,
  PenTool,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface CompanySettings {
  id: string;
  raisonSociale: string;
  formeJuridique: string;
  capitalSocial: string;
  numeroRCS: string;
  villeRCS: string;
  carteProNumero: string;
  carteProMention: string;
  assuranceRCP: string;
  adresseSiege: string;
  representantCivilite: string;
  representantPrenom: string;
  representantNom: string;
  representantQualite: string;
  emailNotification: string | null;
  signaturePath: string | null;
  tamponPath: string | null;
  logoPath: string | null;
}

export default function CompanySettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const signatureRef = useRef<HTMLInputElement>(null);
  const tamponRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  // Redirect si pas admin
  useEffect(() => {
    if (session && session.user?.role !== "ADMIN") {
      router.push("/biens");
    }
  }, [session, router]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (field: keyof CompanySettings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raisonSociale: settings.raisonSociale,
          formeJuridique: settings.formeJuridique,
          capitalSocial: settings.capitalSocial,
          numeroRCS: settings.numeroRCS,
          villeRCS: settings.villeRCS,
          carteProNumero: settings.carteProNumero,
          carteProMention: settings.carteProMention,
          assuranceRCP: settings.assuranceRCP,
          adresseSiege: settings.adresseSiege,
          representantCivilite: settings.representantCivilite,
          representantPrenom: settings.representantPrenom,
          representantNom: settings.representantNom,
          representantQualite: settings.representantQualite,
          emailNotification: settings.emailNotification || "",
        }),
      });

      if (res.ok) {
        setSettings(await res.json());
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Erreur lors de la sauvegarde");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    field: "signature" | "tampon" | "logo",
    file: File
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("field", field);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Paramètres société
          </h1>
          <p className="text-navy-500 text-sm mt-1">
            Ces informations sont injectées dans tous les documents générés
          </p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          {success ? (
            <>
              <Check className="w-4 h-4" /> Sauvegardé
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Enregistrer
            </>
          )}
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-8">
        {/* Section — Identité de la société */}
        <section className="bg-white rounded-2xl border border-navy-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-navy-900">
                Identité de la société
              </h2>
              <p className="text-sm text-navy-500">
                Informations légales de Parkto
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Raison sociale"
              value={settings.raisonSociale}
              onChange={(e) => handleChange("raisonSociale", e.target.value)}
            />
            <Input
              label="Forme juridique"
              value={settings.formeJuridique}
              onChange={(e) => handleChange("formeJuridique", e.target.value)}
            />
            <Input
              label="Capital social (€)"
              value={settings.capitalSocial}
              onChange={(e) => handleChange("capitalSocial", e.target.value)}
            />
            <Input
              label="Numéro RCS"
              value={settings.numeroRCS}
              onChange={(e) => handleChange("numeroRCS", e.target.value)}
            />
            <Input
              label="Ville RCS"
              value={settings.villeRCS}
              onChange={(e) => handleChange("villeRCS", e.target.value)}
            />
            <Input
              label="Adresse du siège social"
              value={settings.adresseSiege}
              onChange={(e) => handleChange("adresseSiege", e.target.value)}
              className="md:col-span-2"
            />
          </div>
        </section>

        {/* Section — Carte professionnelle & Assurance */}
        <section className="bg-white rounded-2xl border border-navy-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-navy-900">
                Carte professionnelle & Assurance
              </h2>
              <p className="text-sm text-navy-500">
                Informations réglementaires
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Numéro de carte professionnelle"
              value={settings.carteProNumero}
              onChange={(e) => handleChange("carteProNumero", e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-navy-700">
                Mention carte professionnelle
              </label>
              <textarea
                value={settings.carteProMention}
                onChange={(e) =>
                  handleChange("carteProMention", e.target.value)
                }
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm resize-none"
              />
            </div>
            <Input
              label="Assurance RCP"
              value={settings.assuranceRCP}
              onChange={(e) => handleChange("assuranceRCP", e.target.value)}
            />
          </div>
        </section>

        {/* Section — Représentant légal */}
        <section className="bg-white rounded-2xl border border-navy-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-navy-900">
                Représentant légal
              </h2>
              <p className="text-sm text-navy-500">
                Signataire des documents
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Civilité"
              value={settings.representantCivilite}
              onChange={(e) =>
                handleChange("representantCivilite", e.target.value)
              }
              placeholder="Mr, Mme..."
            />
            <Input
              label="Qualité"
              value={settings.representantQualite}
              onChange={(e) =>
                handleChange("representantQualite", e.target.value)
              }
            />
            <Input
              label="Prénom"
              value={settings.representantPrenom}
              onChange={(e) =>
                handleChange("representantPrenom", e.target.value)
              }
            />
            <Input
              label="Nom"
              value={settings.representantNom}
              onChange={(e) =>
                handleChange("representantNom", e.target.value)
              }
            />
          </div>
        </section>

        {/* Section — Notifications */}
        <section className="bg-white rounded-2xl border border-navy-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-navy-900">
                Notifications
              </h2>
              <p className="text-sm text-navy-500">
                Email de confirmation pour les signatures DocuSeal
              </p>
            </div>
          </div>

          <Input
            label="Email de notification"
            type="email"
            value={settings.emailNotification || ""}
            onChange={(e) =>
              handleChange("emailNotification", e.target.value)
            }
            placeholder="contact@parkto.fr"
          />
        </section>

        {/* Section — Signature, Tampon & Logo */}
        <section className="bg-white rounded-2xl border border-navy-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Stamp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-navy-900">
                Signature, Tampon & Logo
              </h2>
              <p className="text-sm text-navy-500">
                Images intégrées dans les PDF générés
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Signature */}
            <FileUploadCard
              label="Signature"
              icon={<PenTool className="w-6 h-6" />}
              filePath={settings.signaturePath}
              inputRef={signatureRef}
              onUpload={(file) => handleFileUpload("signature", file)}
            />

            {/* Tampon */}
            <FileUploadCard
              label="Tampon"
              icon={<Stamp className="w-6 h-6" />}
              filePath={settings.tamponPath}
              inputRef={tamponRef}
              onUpload={(file) => handleFileUpload("tampon", file)}
            />

            {/* Logo */}
            <FileUploadCard
              label="Logo"
              icon={<ImageIcon className="w-6 h-6" />}
              filePath={settings.logoPath}
              inputRef={logoRef}
              onUpload={(file) => handleFileUpload("logo", file)}
            />
          </div>
        </section>

        {/* Preview du bloc Parkto */}
        <section className="bg-white rounded-2xl border border-navy-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-navy-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-navy-900">
                Aperçu du bloc Parkto
              </h2>
              <p className="text-sm text-navy-500">
                Tel qu&apos;il apparaîtra dans les documents générés
              </p>
            </div>
          </div>

          <div className="bg-navy-50 rounded-xl p-5 text-sm text-navy-700 leading-relaxed italic">
            Société {settings.raisonSociale}, {settings.formeJuridique.toLowerCase()}{" "}
            au capital social de {settings.capitalSocial} euros, immatriculée au
            registre du commerce et des sociétés de {settings.villeRCS} sous le
            numéro {settings.numeroRCS}, {settings.carteProMention.toLowerCase()},
            assurée en responsabilité civile professionnelle RCP{" "}
            {settings.assuranceRCP.toLowerCase()}, dont le siège social est situé
            au {settings.adresseSiege}, représentée par{" "}
            {settings.representantCivilite} {settings.representantPrenom}{" "}
            {settings.representantNom} en tant que{" "}
            {settings.representantQualite.toLowerCase()} ayant tous pouvoirs pour
            agir aux fins des présentes.
          </div>
        </section>
      </div>

      {/* Bottom spacer mobile */}
      <div className="h-24 lg:h-8" />
    </div>
  );
}

// Composant FileUploadCard
function FileUploadCard({
  label,
  icon,
  filePath,
  inputRef,
  onUpload,
}: {
  label: string;
  icon: React.ReactNode;
  filePath: string | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onUpload: (file: File) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onUpload(file);
    setUploading(false);
    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="border border-dashed border-navy-200 rounded-xl p-4 flex flex-col items-center gap-3 hover:border-primary-300 transition-colors">
      {filePath ? (
        <div className="w-full aspect-[3/2] rounded-lg bg-navy-50 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api${filePath}`}
            alt={label}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      ) : (
        <div className="w-full aspect-[3/2] rounded-lg bg-navy-50 flex flex-col items-center justify-center text-navy-400">
          {icon}
          <span className="text-xs mt-2">Aucun fichier</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      <Button
        variant="secondary"
        size="sm"
        onClick={() => inputRef.current?.click()}
        loading={uploading}
        className="w-full"
      >
        <Upload className="w-3.5 h-3.5" />
        {filePath ? `Modifier ${label}` : `Ajouter ${label}`}
      </Button>
    </div>
  );
}
