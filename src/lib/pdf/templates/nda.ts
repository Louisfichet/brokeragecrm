import { PdfSection, CompanySettingsData, parktoBlock } from "../pdf-engine";

interface NdaFormData {
  documentType: "NDA_TYPE1" | "NDA_TYPE2";
  counterparty: {
    type: "company" | "contact";
    name: string;
    subtitle?: string;
  };
  linkedProperty: boolean;
  property: {
    address: string;
    city: string | null;
    priceFAI: number | null;
  } | null;
  documentDate: string;
  tauxCommission: string;
  montantCommission: string;
  prixBienFaiNv: string;
  // Champs société contrepartie (depuis formData enrichi)
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

export function generateNdaSections(
  formData: NdaFormData,
  settings: CompanySettingsData
): PdfSection[] {
  const isType1 = formData.documentType === "NDA_TYPE1";
  const sections: PdfSection[] = [];
  const date = new Date(formData.documentDate).toLocaleDateString("fr-FR");

  // Titre
  sections.push({
    type: "title",
    content: "ACCORD DE CONFIDENTIALITÉ ET DE NON-CONTOURNEMENT",
  });
  sections.push({
    type: "subtitle",
    content: "Document confidentiel",
  });
  sections.push({ type: "space", size: 0.5 });

  // Entre les soussignés
  sections.push({ type: "bold", content: "Entre les soussignés :" });
  sections.push({ type: "space", size: 0.3 });

  // Partie Divulgatrice / Réceptrice
  if (isType1) {
    // Type 1: Parkto divulgue → Parkto est la Partie Divulgatrice
    sections.push({
      type: "text",
      content: parktoBlock(settings),
    });
    sections.push({
      type: "bold",
      content: 'Ci-après dénommée « la Partie Divulgatrice »,',
    });
    sections.push({ type: "space", size: 0.3 });
    sections.push({ type: "bold", content: "ET" });
    sections.push({ type: "space", size: 0.3 });
    sections.push({
      type: "text",
      content: counterpartyBlock(formData),
    });
    sections.push({
      type: "bold",
      content: 'Ci-après dénommé(e) « la Partie Réceptrice »,',
    });
  } else {
    // Type 2: L'autre partie divulgue
    sections.push({
      type: "text",
      content: counterpartyBlock(formData),
    });
    sections.push({
      type: "bold",
      content: 'Ci-après dénommé(e) « la Partie Divulgatrice »,',
    });
    sections.push({ type: "space", size: 0.3 });
    sections.push({ type: "bold", content: "ET" });
    sections.push({ type: "space", size: 0.3 });
    sections.push({
      type: "text",
      content: parktoBlock(settings),
    });
    sections.push({
      type: "bold",
      content: 'Ci-après dénommée « la Partie Réceptrice »,',
    });
  }

  sections.push({ type: "space", size: 0.3 });
  sections.push({
    type: "text",
    content:
      'Ensemble dénommées « les Parties » et individuellement « une Partie ».',
  });

  // PRÉAMBULE
  sections.push({ type: "space", size: 0.5 });
  sections.push({ type: "article", content: "PRÉAMBULE" });
  sections.push({
    type: "text",
    content:
      "Dans le cadre d'un projet d'évaluation et de négociation commerciale (ci-après « le Projet »), la Partie Divulgatrice est amenée à communiquer à la Partie Réceptrice des informations confidentielles relatives à une opportunité immobilière.",
  });

  if (formData.linkedProperty && formData.property) {
    const prix = formData.property.priceFAI
      ? `${formData.property.priceFAI.toLocaleString("fr-FR")} € ${formData.prixBienFaiNv || "FAI"}`
      : "";
    sections.push({
      type: "text",
      content: `Le Projet porte spécifiquement sur le bien immobilier suivant : ${formData.property.address}${formData.property.city ? `, ${formData.property.city}` : ""}${prix ? `, proposé au prix de ${prix}` : ""} (ci-après « le Bien »).`,
    });
  } else {
    sections.push({
      type: "text",
      content:
        "Le Projet s'inscrit dans le cadre général des échanges commerciaux entre les Parties portant sur des opportunités immobilières à définir.",
    });
  }

  sections.push({
    type: "text",
    content:
      "Les Parties souhaitent définir les conditions dans lesquelles ces informations seront divulguées et protégées.",
  });
  sections.push({
    type: "bold",
    content: "IL A ÉTÉ CONVENU CE QUI SUIT :",
  });

  // Article 1
  sections.push({ type: "space", size: 0.3 });
  sections.push({ type: "article", content: "Article 1 — Définitions" });
  sections.push({
    type: "text",
    content:
      "« Informations Confidentielles » : désigne l'ensemble des documents, données et informations de nature commerciale, financière, comptable, réglementaire, juridique, technique ou stratégique divulgués par la Partie Divulgatrice à la Partie Réceptrice dans le cadre du Projet, quel que soit le support (documents écrits, échanges électroniques, présentations orales, data-room physique ou virtuelle, etc.). Sont notamment inclus : la localisation précise du Bien, le prix de cession, l'identité du vendeur, les documents financiers (baux, loyers, charges, comptes), les plans et diagnostics, les données cadastrales et toute information non publique relative au Projet.",
  });
  sections.push({
    type: "text",
    content:
      "« Projet » : désigne l'opération d'évaluation, d'analyse et de négociation commerciale envisagée entre les Parties, telle que définie au Préambule.",
  });
  sections.push({
    type: "text",
    content:
      "« Tiers » : désigne toute personne physique ou morale non partie au présent Accord.",
  });

  // Article 2
  sections.push({ type: "article", content: "Article 2 — Caractère confidentiel du Projet" });
  sections.push({
    type: "text",
    content:
      "Le Projet revêt un caractère strictement confidentiel. Toute divulgation de son existence à un Tiers est formellement interdite, sauf accord écrit, préalable et exprès de la Partie Divulgatrice.",
  });

  // Article 3
  sections.push({ type: "article", content: "Article 3 — Obligations de confidentialité" });
  sections.push({ type: "bold", content: "3.1 Obligation générale", size: FONT_BODY });
  sections.push({
    type: "text",
    content:
      "La Partie Réceptrice s'engage, et fait en sorte que ses représentants, employés, conseils, sous-traitants et partenaires financiers s'engagent à :",
  });
  sections.push({
    type: "list",
    items: [
      "Traiter les Informations Confidentielles avec la plus stricte confidentialité ;",
      "Prendre toutes mesures appropriées pour protéger leur caractère confidentiel, avec au minimum le même niveau de protection appliqué à ses propres informations sensibles ;",
      "Ne divulguer les Informations Confidentielles qu'aux seuls collaborateurs, conseils ou partenaires financiers ayant un besoin légitime d'en connaître dans le cadre exclusif du Projet, et s'assurer que ces derniers respectent les mêmes obligations ;",
      "Assurer l'intégrité physique et numérique des Informations Confidentielles par tous moyens de sécurité appropriés ;",
      "Ne pas utiliser les Informations Confidentielles à d'autres fins que l'évaluation du Projet ;",
      "Ne pas reproduire, copier ou dupliquer les Informations Confidentielles, sauf dans la stricte mesure nécessaire à l'évaluation du Projet ;",
      "Restituer ou détruire, au choix de la Partie Divulgatrice, toutes les Informations Confidentielles reçues ainsi que toutes copies, immédiatement sur demande écrite, et confirmer par écrit cette restitution ou destruction dans un délai de quinze (15) jours.",
    ],
  });

  sections.push({ type: "bold", content: "3.2 Exceptions", size: FONT_BODY });
  sections.push({
    type: "text",
    content: "Les obligations de confidentialité ne s'appliquent pas aux informations qui :",
  });
  sections.push({
    type: "list",
    items: [
      "Étaient légalement en possession de la Partie Réceptrice avant leur divulgation, dont elle peut apporter la preuve documentaire ;",
      "Sont ou deviennent publiques sans violation du présent Accord ;",
      "Sont légalement reçues d'un Tiers non soumis à obligation de confidentialité ;",
      "Sont divulguées avec l'accord écrit préalable de la Partie Divulgatrice ;",
      "Doivent être divulguées en vertu d'une obligation légale ou judiciaire, la Partie Réceptrice devant en informer préalablement la Partie Divulgatrice et limiter la divulgation au strict nécessaire.",
    ],
  });

  // Article 4 — Non-contournement
  sections.push({ type: "article", content: "Article 4 — Clause de non-contournement" });
  sections.push({
    type: "text",
    content:
      "La Partie Réceptrice s'engage expressément à ne pas contacter, directement ou indirectement, le vendeur, le propriétaire ou tout autre intervenant présenté par la Partie Divulgatrice dans le cadre du Projet, sans l'accord écrit préalable de cette dernière.",
  });
  sections.push({
    type: "text",
    content:
      "Cette interdiction couvre notamment tout contact ayant pour objet ou pour effet de réaliser l'Opération immobilière en excluant la Partie Divulgatrice du processus de transaction.",
  });
  sections.push({
    type: "text",
    content:
      "En cas de contournement avéré, la Partie Réceptrice sera redevable envers la Partie Divulgatrice :",
  });

  if (formData.linkedProperty && formData.tauxCommission) {
    sections.push({
      type: "list",
      items: [
        `D'une indemnité forfaitaire équivalente aux honoraires que la Partie Divulgatrice aurait perçus sur la transaction, soit ${formData.tauxCommission}% du prix de vente du Bien${formData.montantCommission ? ` (représentant environ ${formData.montantCommission} €)` : ""}, majorée de 20% ;`,
        "De pénalités de retard de 2% par mois à compter de la mise en demeure restée sans effet.",
      ],
    });
  } else {
    sections.push({
      type: "list",
      items: [
        "D'une indemnité forfaitaire équivalente aux honoraires que la Partie Divulgatrice aurait perçus sur la transaction concernée, majorée de 20% ;",
        "De pénalités de retard de 2% par mois à compter de la mise en demeure restée sans effet.",
      ],
    });
  }

  sections.push({
    type: "text",
    content:
      "La Partie Divulgatrice se réserve le droit de recourir à tous moyens légaux pour obtenir le paiement des sommes dues.",
  });

  // Articles 5-11
  sections.push({ type: "article", content: "Article 5 — Droits de propriété intellectuelle" });
  sections.push({
    type: "text",
    content:
      "La divulgation d'Informations Confidentielles ne confère à la Partie Réceptrice aucun droit de propriété intellectuelle ou industrielle, ni aucune licence d'exploitation. Les Informations Confidentielles demeurent la propriété exclusive de la Partie Divulgatrice.",
  });
  sections.push({
    type: "text",
    content:
      "Le présent Accord ne constitue ni une offre, ni un engagement de conclure un contrat futur, ni la création d'un partenariat ou d'une société en participation.",
  });

  sections.push({ type: "article", content: "Article 6 — Absence de garantie" });
  sections.push({
    type: "text",
    content:
      "Les Informations Confidentielles sont transmises en l'état. La Partie Divulgatrice ne garantit ni leur exactitude ni leur exhaustivité. La Partie Réceptrice procède à sa propre évaluation et demeure seule responsable de ses décisions.",
  });

  sections.push({ type: "article", content: "Article 7 — Durée" });
  sections.push({
    type: "text",
    content:
      "Le présent Accord entre en vigueur à compter de sa signature et demeure applicable pendant toute la durée des échanges relatifs au Projet.",
  });
  sections.push({
    type: "text",
    content:
      "Les obligations de confidentialité et de non-contournement survivront à l'expiration ou à la résiliation du présent Accord et demeureront en vigueur pendant une durée de cinq (5) ans à compter de la date de divulgation des Informations Confidentielles.",
  });
  sections.push({
    type: "text",
    content:
      "Dans l'hypothèse où les Parties décideraient de ne pas poursuivre le Projet, la Partie Réceptrice s'engage à restituer ou détruire immédiatement l'intégralité des Informations Confidentielles, sans en conserver aucune copie.",
  });

  sections.push({ type: "article", content: "Article 8 — Sanctions et réparations" });
  sections.push({
    type: "text",
    content:
      "La Partie Réceptrice sera tenue responsable de toute violation du présent Accord commise par elle-même ou par ses représentants, employés, conseils ou sous-traitants.",
  });
  sections.push({
    type: "text",
    content:
      "En cas de violation, la Partie Réceptrice s'engage à indemniser intégralement la Partie Divulgatrice de tous préjudices directs et indirects, pertes, dommages, coûts et frais (y compris frais de justice et honoraires d'avocats).",
  });
  sections.push({
    type: "text",
    content:
      "Les Parties reconnaissent que toute violation causerait un préjudice irréparable. En conséquence, la Partie Divulgatrice sera en droit de solliciter toute mesure conservatoire ou d'injonction auprès des tribunaux compétents.",
  });

  sections.push({ type: "article", content: "Article 9 — Divisibilité" });
  sections.push({
    type: "text",
    content:
      "Si une ou plusieurs stipulations du présent Accord sont déclarées nulles ou inapplicables, les autres conserveront toute leur force. Les Parties s'efforceront de les remplacer par des stipulations valides d'effet équivalent.",
  });

  sections.push({ type: "article", content: "Article 10 — Modification" });
  sections.push({
    type: "text",
    content:
      "Toute modification devra faire l'objet d'un avenant écrit, daté et signé par les représentants dûment habilités de chacune des Parties.",
  });

  sections.push({ type: "article", content: "Article 11 — Loi applicable et juridiction" });
  sections.push({
    type: "text",
    content:
      "Le présent Accord est régi par le droit français. Tout litige relatif à sa validité, interprétation, exécution ou résiliation sera soumis à la compétence exclusive des Tribunaux de Paris, nonobstant pluralité de défendeurs ou appel en garantie.",
  });

  // Signature
  sections.push({ type: "separator" });
  sections.push({
    type: "text",
    content: `Fait en deux exemplaires originaux, à Paris, le ${date}`,
    size: FONT_SMALL,
  });
  sections.push({ type: "signature" });

  return sections;
}

// Helper: construire le bloc contrepartie
function counterpartyBlock(formData: NdaFormData): string {
  if (formData.counterparty.type === "company") {
    const parts = [];
    if (formData.counterpartyRaisonSociale) {
      parts.push(
        `La société ${formData.counterpartyRaisonSociale}${formData.counterpartyFormeJuridique ? `, ${formData.counterpartyFormeJuridique}` : ""}${formData.counterpartyCapital ? ` au capital de ${formData.counterpartyCapital} euros` : ""}${formData.counterpartySiret ? `, immatriculée au Registre du Commerce et des Sociétés de ${formData.counterpartyVilleRCS || ""} sous le numéro ${formData.counterpartySiret}` : ""}${formData.counterpartyAdresse ? `, dont le siège social est situé au ${formData.counterpartyAdresse}` : ""}${formData.counterpartyRepresentant ? `, représentée par ${formData.counterpartyRepresentant}` : ""}${formData.counterpartyQualite ? `, en sa qualité de ${formData.counterpartyQualite}` : ""}, ayant tous pouvoirs pour agir aux fins des présentes,`
      );
    } else {
      parts.push(`La société ${formData.counterparty.name},`);
    }
    return parts.join("");
  } else {
    // Personne physique
    const nom = formData.counterpartyNom || formData.counterparty.name;
    const civilite = formData.counterpartyCivilite || "";
    const prenom = formData.counterpartyPrenom || "";
    const adresse = formData.counterpartyAdressePersonne || "";

    let block = `${civilite} ${prenom} ${nom}`.trim();
    if (adresse) block += `, demeurant au ${adresse}`;
    block += ",";
    return block;
  }
}

const FONT_BODY = 9.5;
const FONT_SMALL = 8;
