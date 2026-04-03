import { NextRequest, NextResponse } from "next/server";
import { getSessionScope } from "@/lib/sessionScope";
import { prisma } from "@/lib/prisma";
import { devicesToCsv } from "@/lib/export/csv";

export async function GET(req: NextRequest) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type       = searchParams.get("type");
  const status     = searchParams.get("status");
  const locationId = searchParams.get("locationId");

  // Scoped users are always locked to their customer; admins can filter optionally
  const customerId = scope.customerId ?? searchParams.get("customerId");

  const devices = await prisma.device.findMany({
    where: {
      ...(type       && { type:       type as never }),
      ...(status     && { status:     status as never }),
      ...(customerId && { customerId }),
      ...(locationId && { locationId }),
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
