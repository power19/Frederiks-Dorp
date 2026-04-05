import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/sessionScope";
import { DeviceStatus, DeviceType } from "@/generated/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(DeviceType),
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

export async function GET(req: NextRequest) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as DeviceType | null;
  const status = searchParams.get("status") as DeviceStatus | null;
  const location = searchParams.get("location");
  const search = searchParams.get("search");
  // Scoped users are always filtered to their customer; admins can filter optionally
  const customerId = scope.customerId ?? searchParams.get("customerId");

  // Resellers see devices across all their customers
  const resellerCustomerIds = scope.resellerId
    ? (await prisma.customer.findMany({
        where: { resellerId: scope.resellerId },
        select: { id: true },
      })).map(c => c.id)
    : null;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where = {
    ...(type && { type }),
    ...(status && { status }),
    ...(location && { location: { contains: location } }),
    ...(customerId && { customerId }),
    ...(resellerCustomerIds && !customerId && { customerId: { in: resellerCustomerIds } }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { ipAddress: { contains: search } },
        { location: { contains: search } },
        { manufacturer: { contains: search } },
        { model: { contains: search } },
        { serialNumber: { contains: search } },
      ],
    }),
  };

  const [devices, total] = await Promise.all([
    prisma.device.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.device.count({ where }),
  ]);

  return NextResponse.json({ devices, total, page, limit });
}

export async function POST(req: NextRequest) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (scope.isViewer) return NextResponse.json({ error: "Read-only access" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Scoped users can only create devices for their own customer
  const data = {
    ...parsed.data,
    ...(scope.customerId && { customerId: scope.customerId }),
  };

  // Resellers can only assign devices to their own customers
  if (scope.resellerId && data.customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId }, select: { resellerId: true } });
    if (!customer || customer.resellerId !== scope.resellerId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const device = await prisma.device.create({ data });

  await prisma.changelogEntry.create({
    data: {
      deviceId: device.id,
      action: "CREATED",
      summary: `Device "${device.name}" created`,
      author: scope.userId,
    },
  });

  return NextResponse.json(device, { status: 201 });
}
