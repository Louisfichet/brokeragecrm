import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

// Configuration de mise en page — pro juridique
const PAGE_MARGIN_LEFT = 60;
const PAGE_MARGIN_RIGHT = 60;
const PAGE_MARGIN_TOP = 60;
const PAGE_MARGIN_BOTTOM = 50;
const CONTENT_START_Y = 58;
const FONT_SIZE_TITLE = 13;
const FONT_SIZE_SUBTITLE = 10;
const FONT_SIZE_BODY = 9;
const FONT_SIZE_ARTICLE = 9.5;
const FONT_SIZE_SMALL = 7.5;
const FONT_SIZE_FOOTER = 7;
const LINE_HEIGHT = 1.35;

export interface PdfSection {
  type: "title" | "subtitle" | "text" | "bold" | "article" | "list" | "space" | "separator" | "signature";
  content?: string;
  items?: string[];
  size?: number;
}

export interface CompanySettingsData {
  raisonSociale: string;
  formeJuridique: string;
  capitalSocial: string;
  numeroRCS: string;
  villeRCS: string;
  carteProMention: string;
  assuranceRCP: string;
  adresseSiege: string;
  representantCivilite: string;
  representantPrenom: string;
  representantNom: string;
  representantQualite: string;
  signaturePath: string | null;
  tamponPath: string | null;
  logoPath?: string | null;
}

export function generatePdf(
  sections: PdfSection[],
  settings: CompanySettingsData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: PAGE_MARGIN_TOP,
          bottom: PAGE_MARGIN_BOTTOM,
          left: PAGE_MARGIN_LEFT,
          right: PAGE_MARGIN_RIGHT,
        },
        bufferPages: true,
        info: {
          Title: `Document — ${settings.raisonSociale}`,
          Author: settings.raisonSociale,
          Creator: "PARKTO CRM",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const contentWidth = doc.page.width - PAGE_MARGIN_LEFT - PAGE_MARGIN_RIGHT;

      // Quand PDFKit crée automatiquement une nouvelle page, dessiner l'en-tête
      doc.on("pageAdded", () => {
        renderHeader(doc, settings);
        renderTopRule(doc);
      });

      // Première page : en-tête
      renderHeader(doc, settings);
      renderTopRule(doc);

      // Rendu des sections — PAS de saut de page manuel
      // On laisse PDFKit gérer la pagination naturellement
      for (const section of sections) {
        switch (section.type) {
          case "title":
            doc.moveDown(0.2);
            doc
              .fontSize(FONT_SIZE_TITLE)
              .font("Helvetica-Bold")
              .fillColor("#1a1a2e")
              .text(section.content || "", {
                align: "center",
                lineGap: 3,
                width: contentWidth,
              });
            doc.moveDown(0.15);
            // Filet sous le titre
            {
              const y = doc.y;
              const center = PAGE_MARGIN_LEFT + contentWidth / 2;
              const ruleWidth = 100;
              doc
                .strokeColor("#1a1a2e")
                .lineWidth(0.8)
                .moveTo(center - ruleWidth / 2, y)
                .lineTo(center + ruleWidth / 2, y)
                .stroke();
            }
            doc.moveDown(0.4);
            break;

          case "subtitle":
            doc
              .fontSize(FONT_SIZE_SUBTITLE)
              .font("Helvetica-Oblique")
              .fillColor("#555555")
              .text(section.content || "", { align: "center" });
            doc.fillColor("#1a1a2e");
            doc.moveDown(0.4);
            break;

          case "text":
            doc
              .fontSize(section.size || FONT_SIZE_BODY)
              .font("Helvetica")
              .fillColor("#1a1a2e")
              .text(section.content || "", {
                align: "justify",
                lineGap: (section.size || FONT_SIZE_BODY) * (LINE_HEIGHT - 1),
                width: contentWidth,
              });
            doc.moveDown(0.25);
            break;

          case "bold":
            doc
              .fontSize(section.size || FONT_SIZE_BODY)
              .font("Helvetica-Bold")
              .fillColor("#1a1a2e")
              .text(section.content || "", {
                align: "justify",
                lineGap: (section.size || FONT_SIZE_BODY) * (LINE_HEIGHT - 1),
                width: contentWidth,
              });
            doc.moveDown(0.25);
            break;

          case "article":
            // S'assurer qu'il reste assez de place pour le titre + début du texte (~70pt)
            if (doc.y > doc.page.height - PAGE_MARGIN_BOTTOM - 70) {
              doc.addPage();
            }
            doc.moveDown(0.3);
            // Fond gris léger derrière le titre d'article
            {
              const artY = doc.y;
              doc
                .rect(PAGE_MARGIN_LEFT, artY - 2, contentWidth, 16)
                .fill("#f0f0f5");
              doc
                .fontSize(FONT_SIZE_ARTICLE)
                .font("Helvetica-Bold")
                .fillColor("#1a1a2e")
                .text(section.content || "", PAGE_MARGIN_LEFT + 6, artY, {
                  lineGap: FONT_SIZE_BODY * (LINE_HEIGHT - 1),
                  width: contentWidth - 12,
                });
            }
            doc.moveDown(0.35);
            break;

          case "list":
            if (section.items) {
              for (const item of section.items) {
                doc
                  .fontSize(FONT_SIZE_BODY)
                  .font("Helvetica")
                  .fillColor("#1a1a2e")
                  .text(`—  ${item}`, {
                    indent: 12,
                    align: "justify",
                    lineGap: FONT_SIZE_BODY * (LINE_HEIGHT - 1),
                    width: contentWidth - 12,
                  });
                doc.moveDown(0.12);
              }
            }
            doc.moveDown(0.15);
            break;

          case "space":
            doc.moveDown(section.size || 0.5);
            break;

          case "separator":
            doc.moveDown(0.2);
            {
              const sy = doc.y;
              doc
                .strokeColor("#cccccc")
                .lineWidth(0.4)
                .moveTo(PAGE_MARGIN_LEFT, sy)
                .lineTo(doc.page.width - PAGE_MARGIN_RIGHT, sy)
                .stroke();
            }
            doc.moveDown(0.4);
            break;

          case "signature":
            renderSignatureBlock(doc, settings);
            break;
        }
      }

      // Désactiver complètement la création de pages pendant le rendu des footers
      // car doc.text() dans renderFooter déclenche l'auto-pagination de PDFKit
      doc.removeAllListeners("pageAdded");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalAddPage = (doc as any).addPage.bind(doc);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any).addPage = () => doc; // no-op

      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        renderFooter(doc, settings, i + 1, totalPages);
      }

      // Restaurer addPage avant doc.end()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any).addPage = originalAddPage;

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function renderHeader(doc: PDFKit.PDFDocument, settings: CompanySettingsData) {
  const contentWidth = doc.page.width - PAGE_MARGIN_LEFT - PAGE_MARGIN_RIGHT;

  // Logo en haut à gauche si disponible
  const logoPath = settings.logoPath
    ? path.join(process.cwd(), settings.logoPath.replace(/^\//, ""))
    : path.join(process.cwd(), "uploads", "settings", "logo.png");

  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, PAGE_MARGIN_LEFT, 18, { height: 28 });
    } catch {
      // pas de logo
    }
  }

  // Nom société en haut à droite, discret
  doc
    .fontSize(FONT_SIZE_SMALL)
    .font("Helvetica")
    .fillColor("#999999")
    .text(settings.raisonSociale.toUpperCase(), PAGE_MARGIN_LEFT, 22, {
      align: "right",
      width: contentWidth,
    });

  doc
    .fontSize(6)
    .text(
      `${settings.adresseSiege} — RCS ${settings.villeRCS} ${settings.numeroRCS}`,
      PAGE_MARGIN_LEFT,
      32,
      { align: "right", width: contentWidth }
    );

  doc.fillColor("#1a1a2e");
}

function renderTopRule(doc: PDFKit.PDFDocument) {
  const y = 48;
  doc
    .strokeColor("#1a1a2e")
    .lineWidth(0.6)
    .moveTo(PAGE_MARGIN_LEFT, y)
    .lineTo(doc.page.width - PAGE_MARGIN_RIGHT, y)
    .stroke();
  doc.x = PAGE_MARGIN_LEFT;
  doc.y = CONTENT_START_Y;
}

function renderFooter(
  doc: PDFKit.PDFDocument,
  settings: CompanySettingsData,
  pageNum: number,
  totalPages: number
) {
  const footerY = doc.page.height - 35;
  const contentWidth = doc.page.width - PAGE_MARGIN_LEFT - PAGE_MARGIN_RIGHT;

  doc
    .strokeColor("#cccccc")
    .lineWidth(0.3)
    .moveTo(PAGE_MARGIN_LEFT, footerY - 5)
    .lineTo(doc.page.width - PAGE_MARGIN_RIGHT, footerY - 5)
    .stroke();

  doc
    .fontSize(FONT_SIZE_FOOTER)
    .font("Helvetica")
    .fillColor("#aaaaaa")
    .text(
      `${settings.raisonSociale} — Document confidentiel`,
      PAGE_MARGIN_LEFT,
      footerY,
      { width: contentWidth / 2, lineBreak: false }
    );

  doc
    .fontSize(FONT_SIZE_FOOTER)
    .font("Helvetica")
    .fillColor("#aaaaaa")
    .text(
      `Page ${pageNum}/${totalPages}`,
      PAGE_MARGIN_LEFT + contentWidth / 2,
      footerY,
      { width: contentWidth / 2, align: "right", lineBreak: false }
    );
}

function renderSignatureBlock(
  doc: PDFKit.PDFDocument,
  settings: CompanySettingsData
) {
  // S'assurer qu'il y a assez de place pour le bloc signature (~150pt)
  if (doc.y > doc.page.height - PAGE_MARGIN_BOTTOM - 160) {
    doc.addPage();
  }

  doc.moveDown(0.8);

  const contentWidth = doc.page.width - PAGE_MARGIN_LEFT - PAGE_MARGIN_RIGHT;
  const colWidth = contentWidth / 2 - 15;
  const leftX = PAGE_MARGIN_LEFT;
  const rightX = PAGE_MARGIN_LEFT + colWidth + 30;
  const startY = doc.y;

  // Colonne gauche — Contrepartie
  doc
    .fontSize(FONT_SIZE_SMALL)
    .font("Helvetica-Bold")
    .fillColor("#1a1a2e")
    .text("Pour la contrepartie", leftX, startY, { width: colWidth });

  let leftY = startY + 14;
  doc
    .fontSize(FONT_SIZE_SMALL)
    .font("Helvetica")
    .text("Lu et approuvé — Bon pour accord", leftX, leftY, { width: colWidth });
  leftY += 11;
  doc.text("Date : __ / __ / ______", leftX, leftY, { width: colWidth });
  leftY += 14;
  doc.text("Signature :", leftX, leftY, { width: colWidth });

  // Colonne droite — PARKTO
  doc
    .fontSize(FONT_SIZE_SMALL)
    .font("Helvetica-Bold")
    .fillColor("#1a1a2e")
    .text(`Pour ${settings.raisonSociale}`, rightX, startY, {
      width: colWidth,
    });

  let rightY = startY + 14;
  doc
    .fontSize(FONT_SIZE_SMALL)
    .font("Helvetica")
    .text(
      `${settings.representantCivilite} ${settings.representantPrenom} ${settings.representantNom}`,
      rightX,
      rightY,
      { width: colWidth }
    );
  rightY += 11;
  doc.text(settings.representantQualite, rightX, rightY, { width: colWidth });
  rightY += 11;

  const dateStr = new Date().toLocaleDateString("fr-FR");
  doc.text(`Fait à Paris, le ${dateStr}`, rightX, rightY, { width: colWidth });
  rightY += 18;

  // Signature PNG
  const sigPath = settings.signaturePath
    ? path.join(process.cwd(), settings.signaturePath.replace(/^\//, ""))
    : path.join(process.cwd(), "uploads", "settings", "signature.png");

  if (fs.existsSync(sigPath)) {
    try {
      doc.image(sigPath, rightX, rightY, { width: 90, height: 45 });
    } catch {
      // Ignorer
    }
  }

  // Tampon PNG — superposé à la signature, proportionnel (pas compressé)
  const tamponPath = settings.tamponPath
    ? path.join(process.cwd(), settings.tamponPath.replace(/^\//, ""))
    : path.join(process.cwd(), "uploads", "settings", "tampon.png");

  if (fs.existsSync(tamponPath)) {
    try {
      doc.image(tamponPath, rightX + 50, rightY - 5, {
        fit: [80, 80],
      });
    } catch {
      // Ignorer
    }
  }
}

// Helper: générer le bloc Parkto
export function parktoBlock(settings: CompanySettingsData): string {
  return `Société ${settings.raisonSociale}, ${settings.formeJuridique.toLowerCase()} au capital social de ${settings.capitalSocial} euros, immatriculée au registre du commerce et des sociétés de ${settings.villeRCS} sous le numéro ${settings.numeroRCS}, ${settings.carteProMention.toLowerCase()}, assurée en responsabilité civile professionnelle RCP ${settings.assuranceRCP.toLowerCase()}, dont le siège social est situé au ${settings.adresseSiege}, représentée par ${settings.representantCivilite} ${settings.representantPrenom} ${settings.representantNom} en tant que ${settings.representantQualite.toLowerCase()} ayant tous pouvoirs pour agir aux fins des présentes.`;
}
