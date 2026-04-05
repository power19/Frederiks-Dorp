import { NextRequest, NextResponse } from "next/server";
import { getSessionScope } from "@/lib/sessionScope";
import { prisma } from "@/lib/prisma";
import { DeviceStatus, DeviceType } from "@/generated/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.nativeEnum(DeviceType).optional(),
  ipAddress: z.string().optional().nullable(),
  macAddress: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  status: z.nativeEnum(DeviceStatus).optional(),
  notes: z.string().optional().nullable(),
  wirelessMode: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  parentId: z.string().optional().nullable().transform(v => v || null),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  customerId: z.string().optional().nullable().transform(v => v || null),
  locationId: z.string().optional().nullable().transform(v => v || null),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true, type: true, status: true } },
      changelog: { orderBy: { createdAt: "desc" }, take: 50 },
      customer: { select: { id: true, name: true, resellerId: true } },
      assignedLocation: { select: { id: true, name: true, customerId: true } },
      ports: { orderBy: { portNumber: "asc" } },
    },
  });

  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Scoped users can only see devices belonging to their customer
  if (scope.customerId && device.customerId !== scope.customerId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Resellers can only see devices belonging to their customers
  if (scope.resellerId && (device.customer as { resellerId?: string | null } | null)?.resellerId !== scope.resellerId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(device);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (scope.isViewer) return NextResponse.json({ error: "Read-only access" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.device.findUnique({
    where: { id },
    include: { customer: { select: { resellerId: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Scoped users can only edit devices in their customer
  if (scope.customerId && existing.customerId !== scope.customerId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Resellers can only edit devices belonging to their customers
  if (scope.resellerId && existing.customer?.resellerId !== scope.resellerId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Scoped users cannot reassign a device to a different customer
  const data = {
    ...parsed.data,
    ...(scope.customerId && { customerId: scope.customerId }),
  };

  const updated = await prisma.device.update({ where: { id }, data });

  // Build diff
  const diff: Record<string, [unknown, unknown]> = {};
  for (const [key, newVal] of Object.entries(parsed.data)) {
    const oldVal = (existing as Record<string, unknown>)[key];
    if (oldVal !== newVal) diff[key] = [oldVal, newVal];
  }

  const changedFields = Object.keys(diff);
  if (changedFields.length > 0) {
    const isStatusOnly = changedFields.length === 1 && changedFields[0] === "status";
    await prisma.changelogEntry.create({
      data: {
        deviceId: id,
        action: isStatusOnly ? "STATUS_CHANGED" : "UPDATED",
        summary: isStatusOnly
          ? `Status changed to ${parsed.data.status}`
          : `Updated: ${changedFields.join(", ")}`,
        diff: JSON.stringify(diff),
        author: scope.userId,
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (scope.isViewer) return NextResponse.json({ error: "Read-only access" }, { status: 403 });

  const { id } = await params;

  const device = await prisma.device.findUnique({
    where: { id },
    include: { customer: { select: { resellerId: true } } },
  });
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Scoped users can only delete devices in their customer
  if (scope.customerId && device.customerId !== scope.customerId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Resellers can only delete devices belonging to their customers
  if (scope.resellerId && device.customer?.resellerId !== scope.resellerId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.device.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
