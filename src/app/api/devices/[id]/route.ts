import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  parentId: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  customerId: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true, type: true, status: true } },
      changelog: { orderBy: { createdAt: "desc" }, take: 50 },
      customer: { select: { id: true, name: true } },
      ports: { orderBy: { portNumber: "asc" } },
    },
  });

  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(device);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.device.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.device.update({
    where: { id },
    data: parsed.data,
  });

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
        author: session.user?.email ?? session.user?.name ?? "unknown",
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.device.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
