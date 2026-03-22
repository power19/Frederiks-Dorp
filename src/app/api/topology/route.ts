import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTopologyGraph } from "@/lib/topology";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const devices = await prisma.device.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      ipAddress: true,
      parentId: true,
    },
  });

  const graph = buildTopologyGraph(devices, new Map());
  return NextResponse.json(graph);
}
