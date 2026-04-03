import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller      = session.user as { id?: string; role?: string; customerId?: string | null };
  const callerRole  = caller.role ?? "viewer";
  const callerId    = caller.id ?? "";

  // Only admins and managers can reset passwords
  if (!["admin", "manager"].includes(callerRole))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: targetId } = await params;

  // Fetch the target user
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, customerId: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Cannot reset your own password here (use profile settings)
  if (targetId === callerId)
    return NextResponse.json({ error: "Use your profile to change your own password" }, { status: 400 });

  // Managers can only reset editor/viewer in their own customer
  if (callerRole === "manager") {
    const sameCustomer = caller.customerId && target.customerId === caller.customerId;
    const isSubordinate = ["editor", "viewer"].includes(target.role);
    if (!sameCustomer || !isSubordinate)
      return NextResponse.json({ error: "Managers can only reset passwords of editors and viewers in their customer" }, { status: 403 });
  }

  // Global admin cannot have their password reset via this endpoint (only Brian resets those directly in DB or via another admin)
  // Actually: global admins (no customerId, role=admin) can only be reset by other global admins
  if (target.role === "admin" && callerRole !== "admin")
    return NextResponse.json({ error: "Only a global administrator can reset another administrator's password" }, { status: 403 });

  const { password } = await req.json();
  if (!password || password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: targetId }, data: { password: hashed } });

  return NextResponse.json({ success: true });
}
