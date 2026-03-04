import { PdfSection, CompanySettingsData, parktoBlock } from "../pdf-engine";

interface IntercabFormData {
  counterparty: { type: "company" | "contact"; name: string };
  documentDate: string;
  // Champs société contrepartie
  counterpartyRaisonSociale?: string;
  counterpartyFormeJuridique?: string;
  counterpartyCapital?: string;
  counterpartySiret?: string;
  counterpartyVilleRCS?: string;
  counterpartyAdresse?: string;
  counterpartyRepresentant?: string;
  counterpartyQualite?: string;
  // Champs personne physique
  counterpartyCivilite?: string;
  counterpartyPrenom?: string;
  counterpartyNom?: string;
  counterpartyAdressePersonne?: string;
}

export function generateIntercabSections(
  formData: IntercabFormData,
  settings: CompanySettingsData
): PdfSection[] {
  const sections: PdfSection[] = [];
  const date = new Date(formData.documentDate).toLocaleDateString("fr-FR");
  const partenaireName = formData.counterparty.name;

  // Titre
  sections.push({
    type: "title",
    content: "PROTOCOLE D'INTERMÉDIAIRE ENTRE AGENCES (INTERCAB)",
  });
  sections.push({
    type: "subtitle",
    content: "Convention de co-courtage et partage d'honoraires",
  });
  sections.push({ type: "space", size: 0.5 });

  // Entre les soussignés
  sections.push({ type: "bold", content: "Entre les soussignés :" });
  sections.push({ type: "space", size: 0.3 });

  // PARKTO
  sections.push({ type: "text", content: parktoBlock(settings) });
  sections.push({ type: "bold", content: "Ci-après « PARKTO »" });
  sections.push({ type: "space", size: 0.3 });
  sections.push({ type: "bold", content: "ET" });
  sections.push({ type: "space", size: 0.3 });

  // Partenaire
  sections.push({ type: "text", content: counterpartyBlock(formData) });
  sections.push({ type: "bold", content: "Ci-après « le Partenaire »" });
  sections.push({ type: "space", size: 0.3 });
  sections.push({
    type: "text",
    content: "Ensemble dénommées « les Parties ».",
  });

  // Article 1 — Objet et périmètre
  sections.push({ type: "space", size: 0.3 });
  sections.push({ type: "article", content: "Article 1 — OBJET ET PÉRIMÈTRE" });
  sections.push({
    type: "text",
    content:
      "La présente convention régit exclusivement les opérations de co-courtage, c'est-à-dire les situations où l'une des Parties détient le mandat de vente et l'autre apporte l'acquéreur, la commission étant supportée par une seule partie à la transaction et partagée entre les deux agences.",
  });
  sections.push({
    type: "text",
    content:
      "Elle ne couvre pas les situations où chaque agence est mandatée et rémunérée séparément par son propre client — ces cas étant régis par un accord de confidentialité distinct.",
  });

  // Article 2 — Conditions d'opposabilité
  sections.push({ type: "article", content: "Article 2 — CONDITIONS D'OPPOSABILITÉ" });
  sections.push({
    type: "text",
    content:
      "Le bénéfice du partage d'honoraires est subordonné à la réunion cumulative des conditions suivantes :",
  });
  sections.push({
    type: "list",
    items: [
      "La présentation du bien ou de l'acquéreur a été effectuée par écrit (email ou tout autre support traçable), avec indication du prix, de la référence du bien et/ou des coordonnées de l'acquéreur ;",
      "Cette présentation est antérieure à toute mise en relation directe entre les parties à la transaction ;",
      "L'opération aboutit à la signature d'un acte authentique de vente.",
    ],
  });
  sections.push({
    type: "text",
    content:
      "Toute présentation verbale, non datée ou postérieure à une mise en relation déjà établie sera réputée inopposable.",
  });

  // Article 3 — Répartition des honoraires
  sections.push({ type: "article", content: "Article 3 — RÉPARTITION DES HONORAIRES" });
  sections.push({
    type: "text",
    content:
      "La commission totale perçue sur l'opération est partagée à parts égales, soit 50 % HT pour chaque Partie.",
  });
  sections.push({
    type: "bold",
    content: "Modalités de versement — par ordre de priorité :",
  });
  sections.push({
    type: "text",
    content:
      `Les Parties s'engagent à tout mettre en œuvre pour que le notaire instrumentaire procède à deux virements distincts, l'un en faveur de PARKTO et l'autre en faveur de ${partenaireName}, à hauteur de 50 % HT chacune, sous réserve que les deux agences soient expressément identifiées dans le compromis de vente avec leurs honoraires respectifs.`,
  });
  sections.push({
    type: "text",
    content:
      "À défaut, si le notaire ne peut ou ne souhaite pas procéder à deux virements distincts, l'agence mandatée perçoit l'intégralité de la commission et reverse 50 % HT à l'agence apporteuse dans un délai de 15 jours ouvrés suivant réception de ses propres honoraires, sur présentation de facture.",
  });
  sections.push({
    type: "text",
    content:
      "Les deux Parties s'engagent à se communiquer sans délai les coordonnées du notaire instrumentaire dès la signature du compromis.",
  });

  // Article 4 — Inexécution et pénalités
  sections.push({ type: "article", content: "Article 4 — INEXÉCUTION ET PÉNALITÉS" });
  sections.push({
    type: "text",
    content:
      "En cas de défaut de paiement dans le délai prévu à l'Article 3, la Partie débitrice sera mise en demeure par lettre recommandée avec accusé de réception. Sans régularisation sous 8 jours ouvrés, les sommes dues seront majorées de :",
  });
  sections.push({
    type: "list",
    items: [
      "20 % à titre d'indemnité forfaitaire ;",
      "2 % par mois de retard, à compter de la mise en demeure restée sans effet.",
    ],
  });
  sections.push({
    type: "text",
    content:
      "L'intégralité des frais de recouvrement (honoraires d'avocat, frais d'huissier, frais de procédure) reste à la charge exclusive de la Partie défaillante.",
  });

  // Article 5 — Non-contournement
  sections.push({ type: "article", content: "Article 5 — NON-CONTOURNEMENT" });
  sections.push({
    type: "text",
    content:
      "Chaque Partie s'engage à ne pas contacter, directement ou indirectement, tout client, vendeur, acquéreur ou partenaire présenté par l'autre Partie, sans son accord écrit préalable.",
  });
  sections.push({
    type: "text",
    content:
      "Cette obligation s'applique pendant toute la durée de la convention et pendant deux (2) ans après son expiration, quelle qu'en soit la cause.",
  });
  sections.push({
    type: "text",
    content: "En cas de contournement avéré, la Partie contrevenante sera redevable :",
  });
  sections.push({
    type: "list",
    items: [
      "Des honoraires intégraux que la Partie lésée aurait perçus sur l'opération concernée, majorés de 20 % ;",
      "De pénalités de 2 % par mois à compter de la mise en demeure ;",
      "De tous les frais engagés pour faire constater et sanctionner le contournement.",
    ],
  });
  sections.push({
    type: "text",
    content:
      "Le contournement pourra être établi par tout moyen, notamment par échanges de mails, SMS, relevés d'appels ou témoignages.",
  });

  // Article 6 — Durée
  sections.push({ type: "article", content: "Article 6 — DURÉE" });
  sections.push({
    type: "text",
    content:
      "La convention est conclue pour un (1) an à compter de sa signature, renouvelable par tacite reconduction. Chaque Partie peut y mettre fin par lettre recommandée avec accusé de réception, trois (3) mois avant la date anniversaire.",
  });

  // Article 7 — Litiges
  sections.push({ type: "article", content: "Article 7 — LITIGES" });
  sections.push({
    type: "text",
    content:
      "En cas de différend relatif à l'interprétation ou à l'exécution de la présente convention, les Parties s'engagent à rechercher une solution amiable dans un délai de 30 jours à compter de la notification du différend.",
  });
  sections.push({
    type: "text",
    content:
      "À défaut de résolution amiable, compétence exclusive est attribuée au Tribunal de Commerce de Paris, nonobstant pluralité de défendeurs ou appel en garantie.",
  });

  // Signature
  sections.push({ type: "separator" });
  sections.push({
    type: "text",
    content: `Fait en deux exemplaires originaux à Paris, le ${date}`,
    size: 8,
  });
  sections.push({ type: "signature" });

  return sections;
}

// Helper: construire le bloc contrepartie
function counterpartyBlock(formData: IntercabFormData): string {
  if (formData.counterparty.type === "company") {
    const raisonSociale =
      formData.counterpartyRaisonSociale || formData.counterparty.name;
    let block = `${raisonSociale}`;
    if (formData.counterpartySiret)
      block += `, immatriculée sous le n° ${formData.counterpartySiret}`;
    if (formData.counterpartyAdresse)
      block += `, sise ${formData.counterpartyAdresse}`;
    if (formData.counterpartyRepresentant)
      block += `, représentée par ${formData.counterpartyRepresentant}`;
    if (formData.counterpartyQualite)
      block += `, ${formData.counterpartyQualite}`;
    block += ".";
    return block;
  } else {
    const nom = formData.counterpartyNom || formData.counterparty.name;
    const civilite = formData.counterpartyCivilite || "";
    const prenom = formData.counterpartyPrenom || "";
    let block = `${civilite} ${prenom} ${nom}`.trim();
    if (formData.counterpartyAdressePersonne)
      block += `, demeurant au ${formData.counterpartyAdressePersonne}`;
    block += ".";
    return block;
  }
}
