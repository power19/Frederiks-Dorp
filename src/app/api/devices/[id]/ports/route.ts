import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const portSchema = z.object({
  portNumber: z.number().int().min(1),
  label: z.string().optional().nullable(),
  connectedTo: z.string().optional().nullable(),
  cableType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ports = await prisma.patchPanelPort.findMany({
    where: { deviceId: id },
    orderBy: { portNumber: "asc" },
  });
  return NextResponse.json(ports);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) return NextResponse.json({ error: "Device not found" }, { status: 404 });

  const body = await req.json();
  const parsed = portSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const port = await prisma.patchPanelPort.create({
    data: { deviceId: id, ...parsed.data },
  });

  await prisma.changelogEntry.create({
    data: {
      deviceId: id,
      action: "UPDATED",
      summary: `Port ${port.portNumber} added${port.label ? ` — ${port.label}` : ""}`,
      author: session.user?.email ?? "unknown",
    },
  });

  return NextResponse.json(port, { status: 201 });
}
