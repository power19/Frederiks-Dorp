import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeviceStatus, DeviceType } from "@/generated/prisma";

const VALID_TYPES = Object.values(DeviceType) as string[];
const VALID_STATUSES = Object.values(DeviceStatus) as string[];

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Basic CSV parse — handle quoted fields
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const dryRun = formData.get("dryRun") === "true";

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (!file.name.endsWith(".csv")) {
    return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV is empty or has no data rows" }, { status: 400 });
  }

  const results: {
    row: number;
    name: string;
    status: "ok" | "error" | "skipped";
    message?: string;
  }[] = [];

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-based + header row

    const name = row["name"]?.trim();
    const type = row["type"]?.trim().toUpperCase();
    const status = (row["status"]?.trim().toUpperCase() || "ACTIVE") as DeviceStatus;
    const ipAddress = row["ipAddress"]?.trim() || row["ip_address"]?.trim() || null;
    const macAddress = row["macAddress"]?.trim() || row["mac_address"]?.trim() || null;
    const manufacturer = row["manufacturer"]?.trim() || null;
    const model = row["model"]?.trim() || null;
    const serialNumber = row["serialNumber"]?.trim() || row["serial_number"]?.trim() || null;
    const location = row["location"]?.trim() || null;
    const notes = row["notes"]?.trim() || null;

    // Validate required fields
    if (!name) {
      results.push({ row: rowNum, name: name || "(blank)", status: "error", message: "Missing required field: name" });
      errors++;
      continue;
    }
    if (!type || !VALID_TYPES.includes(type)) {
      results.push({
        row: rowNum, name, status: "error",
        message: `Invalid type "${row["type"]}". Must be one of: ${VALID_TYPES.join(", ")}`,
      });
      errors++;
      continue;
    }
    if (!VALID_STATUSES.includes(status)) {
      results.push({
        row: rowNum, name, status: "error",
        message: `Invalid status "${row["status"]}". Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
      errors++;
      continue;
    }

    // Check for duplicate IP in same import
    if (ipAddress) {
      const dupe = results.find(
        (r) => r.status === "ok" && rows[r.row - 2]?.ipAddress === ipAddress
      );
      if (dupe) {
        results.push({ row: rowNum, name, status: "skipped", message: `Duplicate IP address: ${ipAddress}` });
        skipped++;
        continue;
      }
    }

    if (dryRun) {
      results.push({ row: rowNum, name, status: "ok", message: "Will be created" });
      created++;
      continue;
    }

    try {
      // Check if device with same name already exists
      const existing = await prisma.device.findFirst({ where: { name } });
      if (existing) {
        results.push({ row: rowNum, name, status: "skipped", message: "Device with this name already exists" });
        skipped++;
        continue;
      }

      const device = await prisma.device.create({
        data: {
          name,
          type: type as DeviceType,
          status,
          ipAddress,
          macAddress,
          manufacturer,
          model,
          serialNumber,
          location,
          notes,
        },
      });

      await prisma.changelogEntry.create({
        data: {
          deviceId: device.id,
          action: "CREATED",
          summary: `Device "${device.name}" imported via CSV`,
          author: session.user?.email ?? "import",
        },
      });

      results.push({ row: rowNum, name, status: "ok", message: "Created" });
      created++;
    } catch (err) {
      results.push({ row: rowNum, name, status: "error", message: "Database error: " + String(err) });
      errors++;
    }
  }

  return NextResponse.json({ total: rows.length, created, skipped, errors, dryRun, results });
}
