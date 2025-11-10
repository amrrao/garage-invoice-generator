import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

const ORANGE = "#FF6F00";
const BEIGE = "#FFF3E0";
const DARK_GRAY = "#212121";
const MEDIUM_GRAY = "#424242";
const LIGHT_GRAY = "#757575";
const BORDER_GRAY = "#E0E0E0";


const STATE_TAX_RATES: Record<string, number> = {
  "AL": 0.04, "AK": 0.00, "AZ": 0.056, "AR": 0.065, "CA": 0.0725,
  "CO": 0.029, "CT": 0.0635, "DE": 0.00, "FL": 0.06, "GA": 0.04,
  "HI": 0.04, "ID": 0.06, "IL": 0.0625, "IN": 0.07, "IA": 0.06,
  "KS": 0.065, "KY": 0.06, "LA": 0.0445, "ME": 0.055, "MD": 0.06,
  "MA": 0.0625, "MI": 0.06, "MN": 0.06875, "MS": 0.07, "MO": 0.04225,
  "MT": 0.00, "NE": 0.055, "NV": 0.0685, "NH": 0.00, "NJ": 0.06625,
  "NM": 0.05125, "NY": 0.04, "NC": 0.0475, "ND": 0.05, "OH": 0.0575,
  "OK": 0.045, "OR": 0.00, "PA": 0.06, "RI": 0.07, "SC": 0.06,
  "SD": 0.045, "TN": 0.07, "TX": 0.0625, "UT": 0.061, "VT": 0.06,
  "VA": 0.053, "WA": 0.065, "WV": 0.06, "WI": 0.05, "WY": 0.04,
  "DC": 0.06
};

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
// This is random for now, later there would be a proper invoice number system
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 999999) + 1000;
  return `INV-${year}-${randomNum.toString().padStart(6, '0')}`;
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

export default function generateInvoice(listing: any, recipientName?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);


    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    

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

    const invoiceNumber = generateInvoiceNumber();

    doc.fillColor("black")
      .font("Helvetica-Bold")
      .fontSize(24)
      .text("INVOICE", doc.page.width - 200, 50, { align: "right" });

    doc.font("Helvetica")
      .fontSize(7)
      .fillColor(MEDIUM_GRAY)
      .text(`Invoice #: ${invoiceNumber}`, doc.page.width - 200, 75, { align: "right" });

    doc.font("Helvetica")
      .fontSize(10)
      .fillColor(MEDIUM_GRAY)
      .text(`Date: ${formattedDate}`, doc.page.width - 200, 85, { align: "right" });

    if (recipientName) {
      const billToY = headerHeight - 10;
      doc.font("Helvetica")
        .fontSize(10)
        .fillColor(MEDIUM_GRAY)
        .text("Bill To:", 50, billToY);
      doc.font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(DARK_GRAY)
        .text(sanitizeText(recipientName), 50, billToY + 12);
    }

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
    doc.text("Brand", 65, y + 36);
    doc.font("Helvetica-Bold").fillColor(DARK_GRAY).fontSize(11);
    doc.text(sanitizeText(listing.brand), 65, y + 47, { width: 220 });

    doc.font("Helvetica").fillColor(MEDIUM_GRAY).fontSize(10);
    doc.text("Year", 65, y + 61);
    doc.font("Helvetica-Bold").fillColor(DARK_GRAY).fontSize(11);
    doc.text(sanitizeText(listing.year?.toString()), 65, y + 72);

    doc.font("Helvetica").fillColor(MEDIUM_GRAY).fontSize(10);
    doc.text("Category", 320, y);
    doc.font("Helvetica-Bold").fillColor(DARK_GRAY).fontSize(11);
    doc.text(sanitizeText(listing.category), 320, y + 11, { width: 200, ellipsis: true });

    doc.font("Helvetica").fillColor(MEDIUM_GRAY).fontSize(10);
    doc.text("State", 320, y + 36);
    doc.font("Helvetica-Bold").fillColor(DARK_GRAY).fontSize(11);
    doc.text(sanitizeText(listing.state), 320, y + 47);

    const priceY = infoBoxY + boxHeight + 12;
    const priceBoxHeight = 90;
    doc.rect(50, priceY, boxWidth, priceBoxHeight).fill(BEIGE).strokeColor(ORANGE).lineWidth(1.5).stroke();

    const priceValue =
      typeof listing.price === "number" ? listing.price : parseFloat(listing.price) || 0;

    const taxRate = 0;
    const taxAmount = priceValue * taxRate;
    const totalAmount = priceValue + taxAmount;

    let currentY = priceY + 12;
    
    doc.fillColor(ORANGE)
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(`Price: $${priceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 65, currentY);

    currentY += 25;
        
    const leftX = 65;
    const rightPadding = 10;
    const textWidth = doc.page.width - 100 - rightPadding;


  doc.fillColor(DARK_GRAY)
    .font("Helvetica")
    .fontSize(11)
    .text("Subtotal:", leftX, currentY);

  doc.fillColor(DARK_GRAY)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(
      `$${priceValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      50,
      currentY,
      { width: textWidth, align: "right" }
    );

  currentY += 15;


  doc.fillColor(DARK_GRAY)
    .font("Helvetica")
    .fontSize(11)
    .text("Tax:", leftX, currentY);

  doc.fillColor(DARK_GRAY)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(
      `$${taxAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      50,
      currentY,
      { width: textWidth, align: "right" }
    );

  currentY += 15;


  doc.fillColor(DARK_GRAY)
    .font("Helvetica")
    .fontSize(11)
    .text("Total:", leftX, currentY);

  doc.fillColor(DARK_GRAY)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(
      `$${totalAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      50,
      currentY,
      { width: textWidth, align: "right" }
    );

    const descTitleY = priceY + priceBoxHeight + 12;
    doc.font("Helvetica-Bold").fontSize(18).fillColor(ORANGE).text("Details", 50, descTitleY);

    const descBoxY = descTitleY + 20;
    const descBoxHeight = doc.page.height - descBoxY - 80;

    doc.font("Helvetica").fontSize(9.5).fillColor(DARK_GRAY);

    let descText = sanitizeText(listing.description) || "No details provided.";
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
