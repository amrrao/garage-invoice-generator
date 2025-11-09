import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

const ORANGE = "#FF6F00";
const BEIGE = "#FFF3E0";
const DARK_GRAY = "#212121";
const MEDIUM_GRAY = "#424242";
const LIGHT_GRAY = "#757575";
const BORDER_GRAY = "#E0E0E0";

function sanitizeText(text: string | null | undefined): string {
  if (!text) return "N/A";
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, "--")
    .replace(/\u2013/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\x7F]/g, "");
}

function addFooter(doc: InstanceType<typeof PDFDocument>) {
  const footerY = doc.page.height - 60;

  doc.fontSize(8.5)
    .font("Helvetica")
    .fillColor(LIGHT_GRAY)
    .text("Garage | (201)-293-7164 | support@withgarage.com", 50, footerY, {
      align: "center",
      width: doc.page.width - 100,
    });
}

export default function generateInvoice(listing: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);


    const headerHeight = 85;
    const logoPathPng = path.join(process.cwd(), "public", "garage-logo.png");
    const logoPathJpg = path.join(process.cwd(), "public", "garage-logo.jpg");
    let logoPath: string | null = null;

    if (fs.existsSync(logoPathPng)) logoPath = logoPathPng;
    else if (fs.existsSync(logoPathJpg)) logoPath = logoPathJpg;

    if (logoPath) {
      try {
        doc.image(logoPath, 50, 30, { width: 80, height: 55, fit: [80, 55] });
      } catch (e) {
        console.warn("Logo load failed:", e);
      }
    }

    doc.fillColor("black")
      .font("Helvetica-Bold")
      .fontSize(24)
      .text("INVOICE", doc.page.width - 200, 50, { align: "right" });

    const contentStartY = headerHeight + 25;
    doc.fillColor(ORANGE)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("Vehicle Information", 50, contentStartY);

    const infoBoxY = contentStartY + 25;
    const boxWidth = doc.page.width - 100;
    const boxHeight = 95;

    let y = infoBoxY + 12;
    doc.fontSize(10).font("Helvetica").fillColor(MEDIUM_GRAY);
    doc.text("Title", 65, y);
    doc.font("Helvetica-Bold").fillColor(DARK_GRAY).fontSize(11);
    doc.text(sanitizeText(listing.title), 65, y + 11, { width: 220, ellipsis: true });

    doc.font("Helvetica").fillColor(MEDIUM_GRAY).fontSize(10);
    doc.text("Brand", 65, y + 35);
    doc.font("Helvetica-Bold").fillColor(DARK_GRAY).fontSize(11);
    doc.text(sanitizeText(listing.brand), 65, y + 46, { width: 220 });

    doc.font("Helvetica").fillColor(MEDIUM_GRAY).fontSize(10);
    doc.text("Year", 65, y + 60);
    doc.font("Helvetica-Bold").fillColor(DARK_GRAY).fontSize(11);
    doc.text(sanitizeText(listing.year?.toString()), 65, y + 71);

    doc.font("Helvetica").fillColor(MEDIUM_GRAY).fontSize(10);
    doc.text("Category", 320, y);
    doc.font("Helvetica-Bold").fillColor(DARK_GRAY).fontSize(11);
    doc.text(sanitizeText(listing.category), 320, y + 11, { width: 200, ellipsis: true });

    doc.font("Helvetica").fillColor(MEDIUM_GRAY).fontSize(10);
    doc.text("State", 320, y + 35);
    doc.font("Helvetica-Bold").fillColor(DARK_GRAY).fontSize(11);
    doc.text(sanitizeText(listing.state), 320, y + 46);

    const priceY = infoBoxY + boxHeight + 12;
    doc.rect(50, priceY, boxWidth, 35).fill(BEIGE).strokeColor(ORANGE).lineWidth(1.5).stroke();

    const priceValue =
      typeof listing.price === "number" ? listing.price : parseFloat(listing.price) || 0;

    doc.fillColor(ORANGE)
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(`Price: $${priceValue.toLocaleString()}`, 65, priceY + 8);

    const descTitleY = priceY + 50;
    doc.font("Helvetica-Bold").fontSize(18).fillColor(ORANGE).text("Description", 50, descTitleY);

    const descBoxY = descTitleY + 20;
    const descBoxHeight = doc.page.height - descBoxY - 80;

    doc.font("Helvetica").fontSize(9.5).fillColor(DARK_GRAY);

    let descText = sanitizeText(listing.description) || "No description provided.";
    descText = descText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n{2,}/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/[ \t]*\n[ \t]*/g, "\n")
      .trim();

    doc.y = descBoxY + 8;
    doc.text(descText, 60, doc.y, {
      width: boxWidth - 20,
      height: descBoxHeight - 16,
      align: "left",
      lineGap: 1,
      paragraphGap: 0,
    });

    addFooter(doc);

    doc.end();
  });
}
