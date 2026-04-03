import { NextRequest, NextResponse } from "next/server";
import { getSessionScope } from "@/lib/sessionScope";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Scoped users can only view their own customer
  if (scope.customerId && scope.customerId !== id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      devices: {
        include: { parent: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
      },
      contacts: { orderBy: { createdAt: "asc" } },
      locations: { orderBy: { name: "asc" } },
    },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Only global admins can edit customer info
  if (!scope.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const customer = await prisma.customer.update({ where: { id }, data: parsed.data });
  return NextResponse.json(customer);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Only global admins can delete customers
  if (!scope.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
