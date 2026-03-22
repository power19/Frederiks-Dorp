import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePortSchema = z.object({
  portNumber: z.number().int().min(1).optional(),
  label: z.string().optional().nullable(),
  connectedTo: z.string().optional().nullable(),
  cableType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; portId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, portId } = await params;

  const body = await req.json();
  const parsed = updatePortSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const port = await prisma.patchPanelPort.update({
    where: { id: portId },
    data: parsed.data,
  });

  await prisma.changelogEntry.create({
    data: {
      deviceId: id,
      action: "UPDATED",
      summary: `Port ${port.portNumber} updated`,
      author: session.user?.email ?? "unknown",
    },
  });

  return NextResponse.json(port);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; portId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, portId } = await params;

  const port = await prisma.patchPanelPort.findUnique({ where: { id: portId } });
  if (!port) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.patchPanelPort.delete({ where: { id: portId } });

  await prisma.changelogEntry.create({
    data: {
      deviceId: id,
      action: "UPDATED",
      summary: `Port ${port.portNumber} removed`,
      author: session.user?.email ?? "unknown",
    },
  });

  return NextResponse.json({ success: true });
}
