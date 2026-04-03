import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/sessionScope";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  // Scoped users only see their own customer
  if (scope.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: scope.customerId },
      include: { _count: { select: { devices: true } } },
    });
    return NextResponse.json(customer ? [customer] : []);
  }

  const customers = await prisma.customer.findMany({
    where: search ? {
      OR: [
        { name: { contains: search } },
        { contacts: { some: { name: { contains: search } } } },
      ],
    } : undefined,
    include: { _count: { select: { devices: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const scope = await getSessionScope();
  if (!scope || !scope.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const customer = await prisma.customer.create({ data: parsed.data });
  return NextResponse.json(customer, { status: 201 });
}
