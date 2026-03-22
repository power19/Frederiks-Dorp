import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pingHost } from "@/lib/ping";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!device.ipAddress) {
    return NextResponse.json({ error: "No IP address configured" }, { status: 400 });
  }

  const result = await pingHost(device.ipAddress);
  return NextResponse.json(result);
}
