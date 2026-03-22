import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { devicesToCsv } from "@/lib/export/csv";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const devices = await prisma.device.findMany({
    where: {
      ...(type && { type: type as never }),
      ...(status && { status: status as never }),
    },
    include: { parent: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const csv = devicesToCsv(devices as never);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="network-inventory-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
