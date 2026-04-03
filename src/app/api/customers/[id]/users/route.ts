import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

// GET — list all users assigned to this customer
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const users = await prisma.user.findMany({
    where: { customerId: id },
    select: { id: true, name: true, email: true, role: true, customerId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

// POST — create a new user scoped to this customer
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, email, password, role } = await req.json();

  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  if (!["manager", "editor", "viewer"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name: name || null, email, password: hashed, role, customerId: id },
    select: { id: true, name: true, email: true, role: true, customerId: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
