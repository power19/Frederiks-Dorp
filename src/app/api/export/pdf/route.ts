import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDevicePdf } from "@/lib/export/pdf";

export const runtime = "nodejs";

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

  const pdfBuffer = generateDevicePdf(devices as never);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="network-inventory-${new Date().toISOString().split("T")[0]}.pdf"`,
    },
  });
}
