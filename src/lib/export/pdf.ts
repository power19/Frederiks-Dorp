import PDFDocument from "pdfkit";
import { DeviceWithRelations } from "@/types";

export function generateDevicePdf(devices: DeviceWithRelations[]): Buffer {
  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // Header
  doc.fontSize(18).font("Helvetica-Bold").text("Network Inventory Report", { align: "center" });
  doc.fontSize(10).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
  doc.moveDown(1.5);

  // Column definitions
  const cols = [
    { label: "Name", key: "name", width: 90 },
    { label: "Type", key: "type", width: 70 },
    { label: "IP Address", key: "ipAddress", width: 80 },
    { label: "Location", key: "location", width: 80 },
    { label: "Status", key: "status", width: 65 },
    { label: "Manufacturer", key: "manufacturer", width: 80 },
    { label: "Model", key: "model", width: 80 },
    { label: "Serial #", key: "serialNumber", width: 90 },
  ];

  const tableTop = doc.y;
  const startX = 40;
  const rowHeight = 20;

  // Draw header row
  doc.font("Helvetica-Bold").fontSize(9);
  let x = startX;
  cols.forEach((col) => {
    doc.rect(x, tableTop, col.width, rowHeight).fillAndStroke("#1e40af", "#1e40af");
    doc.fillColor("white").text(col.label, x + 3, tableTop + 5, { width: col.width - 6 });
    x += col.width;
  });

  // Draw data rows
  doc.font("Helvetica").fontSize(8);
  devices.forEach((device, i) => {
    const rowY = tableTop + rowHeight * (i + 1);
    const bg = i % 2 === 0 ? "#f8fafc" : "white";

    x = startX;
    doc.fillColor(bg);
    cols.forEach((col) => {
      doc.rect(x, rowY, col.width, rowHeight).fillAndStroke(bg, "#e2e8f0");
      const val = String((device as unknown as Record<string, unknown>)[col.key] ?? "—");
      doc.fillColor("#0f172a").text(val, x + 3, rowY + 5, { width: col.width - 6 });
      x += col.width;
    });

    // Page break if needed
    if (rowY + rowHeight * 2 > doc.page.height - 40) {
      doc.addPage();
    }
  });

  doc.end();

  return Buffer.concat(chunks);
}
