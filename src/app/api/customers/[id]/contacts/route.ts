import { NextRequest, NextResponse } from "next/server";
import { getSessionScope } from "@/lib/sessionScope";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Scoped users can only view their own customer's contacts
  if (scope.customerId && scope.customerId !== id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contacts = await prisma.customerContact.findMany({
    where: { customerId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest, { params }: Params) {
  const scope = await getSessionScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Only admins can manage contacts
  if (!scope.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, ...rest } = parsed.data;
  const contact = await prisma.customerContact.create({
    data: { ...rest, email: email || null, customerId: id },
  });

  return NextResponse.json(contact, { status: 201 });
}
