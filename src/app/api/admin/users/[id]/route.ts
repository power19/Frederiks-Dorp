import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { role, customerId } = body;

  if (role !== undefined && !["admin", "manager", "editor", "viewer"].includes(role))
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  // Prevent changing yourself
  if (params.id === (session.user as { id?: string }).id)
    return NextResponse.json({ error: "Cannot change your own account" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(role !== undefined      && { role }),
      ...(customerId !== undefined && { customerId: customerId || null }),
    },
    select: { id: true, name: true, email: true, role: true, customerId: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (params.id === (session.user as { id?: string }).id)
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
