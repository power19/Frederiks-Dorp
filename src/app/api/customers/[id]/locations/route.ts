import { NextRequest, NextResponse } from "next/server";
import { getSessionScope } from "@/lib/sessionScope";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  address: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Scoped users can only view their own customer's locations
  if (scope.customerId && scope.customerId !== id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const locations = await prisma.location.findMany({
    where: { customerId: id },
    include: { _count: { select: { devices: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(locations);
}

export async function POST(req: NextRequest, { params }: Params) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Only admins can create locations
  if (!scope.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const location = await prisma.location.create({ data: { ...parsed.data, customerId: id } });
  return NextResponse.json(location, { status: 201 });
}
