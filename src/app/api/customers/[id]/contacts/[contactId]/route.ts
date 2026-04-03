import { NextRequest, NextResponse } from "next/server";
import { getSessionScope } from "@/lib/sessionScope";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string; contactId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!scope.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { contactId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, ...rest } = parsed.data;
  const contact = await prisma.customerContact.update({
    where: { id: contactId },
    data: { ...rest, email: email || null },
  });

  return NextResponse.json(contact);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!scope.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { contactId } = await params;
  await prisma.customerContact.delete({ where: { id: contactId } });
  return NextResponse.json({ success: true });
}
