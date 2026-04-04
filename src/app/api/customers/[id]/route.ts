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

async function checkCustomerAccess(id: string, scope: Awaited<ReturnType<typeof getSessionScope>>) {
  if (!scope) return false;
  if (scope.customerId && scope.customerId !== id) return false;
  if (scope.isReseller) {
    const c = await prisma.customer.findUnique({ where: { id }, select: { resellerId: true } });
    if (c?.resellerId !== scope.userId) return false;
  }
  return true;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!await checkCustomerAccess(id, scope))
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
  if (!scope.isAdmin && !scope.isReseller)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  if (!await checkCustomerAccess(id, scope))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const customer = await prisma.customer.update({ where: { id }, data: parsed.data });
  return NextResponse.json(customer);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!scope.isAdmin && !scope.isReseller)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  if (!await checkCustomerAccess(id, scope))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
