import { PdfSection, CompanySettingsData, parktoBlock } from "../pdf-engine";

interface MandatFormData {
  counterparty: { type: "company" | "contact"; name: string };
  documentDate: string;
  // Critères de recherche
  typesBien: string[];
  typeBienAutre: string;
  localisation: string;
  departement: string;
  region: string;
  surfaceMin: string;
  surfaceMax: string;
  budgetMax: string;
  budgetFaiNv: "FAI" | "NV";
  rendementMin: string;
  delaiRealisation: string;
  criteresComplementaires: string;
  // Honoraires
  modeHonoraires: "pourcentage" | "forfait" | "vendeur";
  tauxHonoraires: string;
  montantForfait: string;
  // Durée
  dureeMandat: string;
  // Contrepartie
  counterpartyRaisonSociale?: string;
  counterpartyFormeJuridique?: string;
  counterpartyCapital?: string;
  counterpartySiret?: string;
  counterpartyVilleRCS?: string;
  counterpartyAdresse?: string;
  counterpartyRepresentant?: string;
  counterpartyQualite?: string;
  counterpartyCivilite?: string;
  counterpartyPrenom?: string;
  counterpartyNom?: string;
  counterpartyAdressePersonne?: string;
}

export function generateMandatSections(
  formData: MandatFormData,
  settings: CompanySettingsData
): PdfSection[] {
  const sections: PdfSection[] = [];
  const date = new Date(formData.documentDate).toLocaleDateString("fr-FR");
  const mandantName = formData.counterparty.name;

  // Calculer date de fin du mandat
  const dateDebut = new Date(formData.documentDate);
  const duree = parseInt(formData.dureeMandat) || 12;
  const dateFin = new Date(dateDebut);
  dateFin.setMonth(dateFin.getMonth() + duree);
  const dateFinStr = dateFin.toLocaleDateString("fr-FR");

  // Titre
  sections.push({
    type: "title",
    content: "MANDAT DE RECHERCHE IMMOBILIÈRE",
  });
  sections.push({
    type: "subtitle",
    content: "Document confidentiel",
  });
  sections.push({ type: "space", size: 0.5 });

  // Entre les soussignés
  sections.push({ type: "bold", content: "Entre les soussignés :" });
  sections.push({ type: "space", size: 0.3 });

  // PARKTO = Mandataire
  sections.push({ type: "text", content: parktoBlock(settings) });
  sections.push({
    type: "bold",
    content: 'Ci-après dénommée « le Mandataire »,',
  });
  sections.push({ type: "space", size: 0.3 });
  sections.push({ type: "bold", content: "ET" });
  sections.push({ type: "space", size: 0.3 });

  // Mandant (contrepartie)
  if (formData.counterparty.type === "company") {
    const raisonSociale =
      formData.counterpartyRaisonSociale || mandantName;
    let block = `La société ${raisonSociale}`;
    if (formData.counterpartyFormeJuridique)
      block += `, ${formData.counterpartyFormeJuridique}`;
    if (formData.counterpartyCapital)
      block += ` au capital de ${formData.counterpartyCapital} euros`;
    if (formData.counterpartySiret)
      block += `, immatriculée au Registre du Commerce et des Sociétés de ${formData.counterpartyVilleRCS || ""} sous le numéro ${formData.counterpartySiret}`;
    if (formData.counterpartyAdresse)
      block += `, dont le siège social est situé au ${formData.counterpartyAdresse}`;
    if (formData.counterpartyRepresentant)
      block += `, représentée par ${formData.counterpartyRepresentant}`;
    if (formData.counterpartyQualite)
      block += `, en sa qualité de ${formData.counterpartyQualite}`;
    block += ", ayant tous pouvoirs pour agir aux fins des présentes,";
    sections.push({ type: "text", content: block });
  } else {
    const nom = formData.counterpartyNom || mandantName;
    const civilite = formData.counterpartyCivilite || "";
    const prenom = formData.counterpartyPrenom || "";
    let block = `${civilite} ${prenom} ${nom}`.trim();
    if (formData.counterpartyAdressePersonne)
      block += `, demeurant au ${formData.counterpartyAdressePersonne}`;
    block += ",";
    sections.push({ type: "text", content: block });
  }

  sections.push({
    type: "bold",
    content: 'Ci-après dénommé(e) « le Mandant »,',
  });
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
      "Le Mandant souhaite acquérir un bien immobilier répondant aux critères définis ci-après et confie à PARKTO, en sa qualité de broker immobilier professionnel, une mission de recherche, d'identification et de présentation de biens susceptibles de correspondre à ses besoins.",
  });
  sections.push({
    type: "text",
    content:
      "Le présent mandat est conclu préalablement à tout commencement de mission par le Mandataire, conformément aux dispositions de la loi n° 70-9 du 2 janvier 1970 dite loi Hoguet et de son décret d'application.",
  });

  // Article 1 — OBJET
  sections.push({ type: "article", content: "Article 1 — OBJET DU MANDAT" });
  sections.push({
    type: "text",
    content:
      "Le Mandant donne mandat à PARKTO de rechercher, identifier et présenter tout bien immobilier correspondant aux critères définis à l'Article 2 du présent mandat.",
  });
  sections.push({
    type: "text",
    content:
      "Ce mandat est consenti à titre non exclusif : le Mandant conserve la faculté de rechercher par lui-même ou de mandater d'autres professionnels, sous réserve des dispositions de l'Article 5 du présent mandat relatives à la non-éviction.",
  });
  sections.push({
    type: "text",
    content:
      "PARKTO s'engage à accomplir sa mission avec diligence, professionnalisme et loyauté, dans l'intérêt du Mandant.",
  });

  // Article 2 — CRITÈRES DE RECHERCHE
  sections.push({
    type: "article",
    content: "Article 2 — CRITÈRES DE RECHERCHE",
  });
  sections.push({
    type: "text",
    content:
      "Le Mandant définit les critères de recherche suivants :",
  });

  // 2.1 Type de bien
  sections.push({ type: "bold", content: "2.1 Type de bien recherché" });
  if (formData.typesBien.length > 0) {
    const typesLabels: Record<string, string> = {
      local_commercial: "Local commercial",
      bureau: "Bureau",
      immeuble_rapport: "Immeuble de rapport",
      entrepot: "Entrepôt / Local d'activités",
      fonds_commerce: "Fonds de commerce",
      terrain: "Terrain",
    };
    const items = formData.typesBien.map(
      (t) => typesLabels[t] || t
    );
    if (formData.typeBienAutre) {
      items.push(`Autre : ${formData.typeBienAutre}`);
    }
    sections.push({ type: "list", items });
  }

  // 2.2 Localisation
  sections.push({ type: "bold", content: "2.2 Localisation souhaitée" });
  const locParts: string[] = [];
  if (formData.localisation)
    locParts.push(
      `Ville(s) / Zone(s) géographique(s) : ${formData.localisation}`
    );
  if (formData.departement)
    locParts.push(`Département(s) : ${formData.departement}`);
  if (formData.region) locParts.push(`Région(s) : ${formData.region}`);
  if (locParts.length > 0) {
    sections.push({ type: "text", content: locParts.join("\n") });
  }

  // 2.3 Caractéristiques
  sections.push({
    type: "bold",
    content: "2.3 Caractéristiques du bien",
  });
  const caracItems: string[] = [];
  if (formData.surfaceMin || formData.surfaceMax) {
    let surfTxt = "Surface : ";
    if (formData.surfaceMin && formData.surfaceMax) {
      surfTxt += `de ${formData.surfaceMin} m² à ${formData.surfaceMax} m²`;
    } else if (formData.surfaceMin) {
      surfTxt += `minimum ${formData.surfaceMin} m²`;
    } else {
      surfTxt += `maximum ${formData.surfaceMax} m²`;
    }
    caracItems.push(surfTxt);
  }
  if (formData.budgetMax) {
    caracItems.push(
      `Budget maximum : ${Number(formData.budgetMax).toLocaleString("fr-FR")} € ${formData.budgetFaiNv || "FAI"}`
    );
  }
  if (formData.rendementMin) {
    caracItems.push(
      `Rendement locatif minimum souhaité : ${formData.rendementMin}%`
    );
  }
  if (formData.delaiRealisation) {
    caracItems.push(
      `Délai de réalisation souhaité : ${formData.delaiRealisation}`
    );
  }
  if (formData.criteresComplementaires) {
    caracItems.push(
      `Critères complémentaires : ${formData.criteresComplementaires}`
    );
  }
  if (caracItems.length > 0) {
    sections.push({ type: "list", items: caracItems });
  }

  sections.push({
    type: "text",
    content:
      "Le Mandant reconnaît que ces critères constituent une indication de ses besoins et pourront être affinés d'un commun accord au cours de la mission.",
  });

  // Article 3 — DURÉE
  sections.push({
    type: "article",
    content: "Article 3 — DURÉE DU MANDAT",
  });
  sections.push({
    type: "text",
    content: `Le présent mandat prend effet à compter de sa signature par les deux Parties et est consenti pour une durée de ${duree} mois, soit jusqu'au ${dateFinStr}.`,
  });
  sections.push({
    type: "text",
    content:
      "À l'expiration de cette durée, le mandat pourra être renouvelé par accord écrit entre les Parties.",
  });
  sections.push({
    type: "text",
    content:
      "Chacune des Parties peut mettre fin au présent mandat avant son terme par lettre recommandée avec accusé de réception, sous réserve d'un préavis de quinze (15) jours. La résiliation anticipée ne remet pas en cause les droits à honoraires de PARKTO pour tout bien présenté avant la date de résiliation, conformément à l'Article 5.",
  });

  // Article 4 — RÉMUNÉRATION
  sections.push({
    type: "article",
    content: "Article 4 — RÉMUNÉRATION DE PARKTO",
  });
  if (formData.modeHonoraires === "pourcentage") {
    sections.push({
      type: "text",
      content: `En contrepartie de sa mission, PARKTO percevra des honoraires d'un montant de ${formData.tauxHonoraires}% HT du prix de vente effectif du bien acquis par le Mandant.`,
    });
  } else if (formData.modeHonoraires === "forfait") {
    sections.push({
      type: "text",
      content: `En contrepartie de sa mission, PARKTO percevra des honoraires forfaitaires d'un montant de ${Number(formData.montantForfait).toLocaleString("fr-FR")} € HT.`,
    });
  } else {
    sections.push({
      type: "text",
      content:
        "Les honoraires de PARKTO sont à la charge du vendeur du bien acquis, conformément aux conditions définies avec ce dernier. Aucune rémunération ne sera due par le Mandant à PARKTO au titre du présent mandat.",
    });
  }
  sections.push({
    type: "text",
    content:
      "Dans tous les cas, les honoraires sont dus et exigibles exclusivement à la date de signature de l'acte authentique de vente constatant le transfert de propriété du bien au profit du Mandant. Aucun honoraire ne sera dû en l'absence de réalisation effective de la transaction.",
  });
  sections.push({
    type: "text",
    content:
      "Le Mandant reconnaît avoir été informé des modalités de rémunération de PARKTO préalablement à la signature du présent mandat, conformément aux dispositions légales en vigueur.",
  });

  // Article 5 — NON-ÉVICTION
  sections.push({
    type: "article",
    content: "Article 5 — CLAUSE DE NON-ÉVICTION ET NON-CONTOURNEMENT",
  });
  sections.push({ type: "bold", content: "5.1 Protection de l'intermédiation de PARKTO" });
  sections.push({
    type: "text",
    content:
      "Le Mandant s'engage expressément à ne pas contacter, directement ou indirectement, tout vendeur, propriétaire, intermédiaire ou toute autre personne présentée par PARKTO dans le cadre du présent mandat, sans l'accord écrit préalable de PARKTO.",
  });
  sections.push({
    type: "text",
    content:
      "Cette interdiction couvre notamment toute démarche ayant pour objet ou pour effet de réaliser l'acquisition d'un bien présenté par PARKTO en excluant ce dernier du processus de transaction.",
  });

  sections.push({ type: "bold", content: "5.2 Pénalités en cas de contournement" });
  sections.push({
    type: "text",
    content:
      "En cas de contournement avéré de PARKTO par le Mandant, le Mandant sera redevable envers PARKTO :",
  });

  if (formData.modeHonoraires === "pourcentage" && formData.tauxHonoraires) {
    sections.push({
      type: "list",
      items: [
        `D'une indemnité forfaitaire équivalente aux honoraires que PARKTO aurait perçus sur la transaction, soit ${formData.tauxHonoraires}% du prix de vente effectif du bien concerné, majorée de 20% ;`,
        "De pénalités de retard de 2% par mois à compter de la mise en demeure restée sans effet pendant quinze (15) jours.",
      ],
    });
  } else {
    sections.push({
      type: "list",
      items: [
        "D'une indemnité forfaitaire équivalente aux honoraires que PARKTO aurait perçus sur la transaction concernée, majorée de 20% ;",
        "De pénalités de retard de 2% par mois à compter de la mise en demeure restée sans effet pendant quinze (15) jours.",
      ],
    });
  }

  sections.push({
    type: "text",
    content:
      "PARKTO se réserve le droit de recourir à tous moyens légaux pour obtenir le paiement des sommes dues et le remboursement de tous frais engagés à cette fin.",
  });

  sections.push({ type: "bold", content: "5.3 Survie de la clause" });
  sections.push({
    type: "text",
    content:
      "La présente clause de non-éviction s'applique pendant toute la durée du mandat et pendant une période de douze (12) mois suivant son expiration ou sa résiliation, pour tout bien présenté par PARKTO avant cette date.",
  });

  // Article 6 — CONFIDENTIALITÉ
  sections.push({
    type: "article",
    content: "Article 6 — CONFIDENTIALITÉ",
  });
  sections.push({
    type: "text",
    content:
      "Les Parties reconnaissent que l'ensemble des informations échangées dans le cadre du présent mandat (caractéristiques des biens présentés, identité des vendeurs, données financières, conditions de vente) revêtent un caractère strictement confidentiel.",
  });
  sections.push({
    type: "text",
    content: "Le Mandant s'engage à :",
  });
  sections.push({
    type: "list",
    items: [
      "Ne pas divulguer ces informations à des tiers sans l'accord écrit préalable de PARKTO ;",
      "N'utiliser ces informations qu'aux seules fins d'évaluation des biens présentés ;",
      "Veiller au respect de cette obligation par ses collaborateurs, conseils et partenaires financiers.",
    ],
  });
  sections.push({
    type: "text",
    content:
      "Cette obligation de confidentialité demeure en vigueur pendant toute la durée du mandat et pendant cinq (5) ans après son expiration.",
  });

  // Article 7 — OBLIGATIONS DU MANDATAIRE
  sections.push({
    type: "article",
    content: "Article 7 — OBLIGATIONS DU MANDATAIRE",
  });
  sections.push({
    type: "text",
    content: "PARKTO s'engage à :",
  });
  sections.push({
    type: "list",
    items: [
      "Effectuer des recherches actives et diligentes correspondant aux critères définis à l'Article 2 ;",
      "Présenter au Mandant tout bien susceptible de correspondre à ses critères de recherche ;",
      "Informer le Mandant de l'avancement de la mission à sa demande ;",
      "Agir dans le strict respect des dispositions légales et réglementaires applicables à l'activité de transaction immobilière, et notamment de la loi Hoguet du 2 janvier 1970 ;",
      "Conserver la confidentialité des informations communiquées par le Mandant relatives à ses critères de recherche et à sa situation financière.",
    ],
  });

  // Article 8 — OBLIGATIONS DU MANDANT
  sections.push({
    type: "article",
    content: "Article 8 — OBLIGATIONS DU MANDANT",
  });
  sections.push({
    type: "text",
    content: "Le Mandant s'engage à :",
  });
  sections.push({
    type: "list",
    items: [
      "Communiquer à PARKTO toute information utile à la bonne exécution de la mission (situation financière, capacité d'emprunt, critères précis) ;",
      "Informer PARKTO sans délai de toute modification de ses critères de recherche ou de l'abandon de son projet d'acquisition ;",
      "Informer PARKTO sans délai de tout contact reçu directement d'un vendeur ou d'un intermédiaire concernant un bien correspondant à ses critères ;",
      "Désigner le notaire de son choix en temps utile et communiquer ses coordonnées à PARKTO.",
    ],
  });

  // Article 9 — ABSENCE D'OBLIGATION DE RÉSULTAT
  sections.push({
    type: "article",
    content: "Article 9 — ABSENCE D'OBLIGATION DE RÉSULTAT",
  });
  sections.push({
    type: "text",
    content:
      "Le présent mandat constitue une obligation de moyens et non de résultat. PARKTO ne saurait être tenue responsable en cas d'absence de bien correspondant aux critères définis, de refus du vendeur, ou de non-réalisation de la transaction pour une cause extérieure à sa mission.",
  });

  // Article 10 — LOI APPLICABLE
  sections.push({
    type: "article",
    content: "Article 10 — LOI APPLICABLE ET JURIDICTION",
  });
  sections.push({
    type: "text",
    content:
      "Le présent mandat est régi par le droit français, et notamment par la loi n° 70-9 du 2 janvier 1970 et son décret d'application n° 72-678 du 20 juillet 1972.",
  });
  sections.push({
    type: "text",
    content:
      "Tout litige relatif à la validité, l'interprétation ou l'exécution du présent mandat sera soumis à la compétence exclusive du Tribunal de Commerce de Paris.",
  });

  // Signature
  sections.push({ type: "separator" });
  sections.push({
    type: "text",
    content: `Fait en deux exemplaires originaux, à Paris, le ${date}`,
    size: 8,
  });
  sections.push({
    type: "text",
    content:
      "Le Mandant reconnaît avoir reçu un exemplaire du présent mandat préalablement à tout commencement de mission par PARKTO.",
    size: 8,
  });
  sections.push({ type: "signature" });

  return sections;
}
