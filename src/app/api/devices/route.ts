import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  parentId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as DeviceType | null;
  const status = searchParams.get("status") as DeviceStatus | null;
  const location = searchParams.get("location");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where = {
    ...(type && { type }),
    ...(status && { status }),
    ...(location && { location: { contains: location } }),
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
      include: { parent: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.device.count({ where }),
  ]);

  return NextResponse.json({ devices, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const device = await prisma.device.create({
    data: parsed.data,
  });

  await prisma.changelogEntry.create({
    data: {
      deviceId: device.id,
      action: "CREATED",
      summary: `Device "${device.name}" created`,
      author: session.user?.email ?? session.user?.name ?? "unknown",
    },
  });

  return NextResponse.json(device, { status: 201 });
}
