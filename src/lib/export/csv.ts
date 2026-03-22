import { DeviceWithRelations } from "@/types";

export function devicesToCsv(devices: DeviceWithRelations[]): string {
  const headers = [
    "Name",
    "Type",
    "IP Address",
    "MAC Address",
    "Manufacturer",
    "Model",
    "Serial Number",
    "Location",
    "Status",
    "Connected To",
    "Notes",
    "Created",
    "Updated",
  ];

  const escape = (val: string | null | undefined) => {
    if (val == null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = devices.map((d) => [
    escape(d.name),
    escape(d.type),
    escape(d.ipAddress),
    escape(d.macAddress),
    escape(d.manufacturer),
    escape(d.model),
    escape(d.serialNumber),
    escape(d.location),
    escape(d.status),
    escape(d.parent?.name),
    escape(d.notes),
    escape(d.createdAt.toISOString()),
    escape(d.updatedAt.toISOString()),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
