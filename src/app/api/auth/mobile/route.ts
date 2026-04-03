import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

/**
 * Mobile login endpoint.
 * Returns a NextAuth-compatible JWT that the mobile app stores securely
 * and sends as "Authorization: Bearer <token>" on every API request.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body ?? {};

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Encode a NextAuth-compatible JWT signed with the same secret
  // so getSessionScope() can verify it via getToken()
  const token = await encode({
    token: {
      id:         user.id,
      email:      user.email,
      name:       user.name ?? "",
      role:       user.role,
      customerId: user.customerId ?? null,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge:  30 * 24 * 60 * 60, // 30 days
  });

  return NextResponse.json({
    token,
    user: {
      id:         user.id,
      email:      user.email,
      name:       user.name,
      role:       user.role,
      customerId: user.customerId ?? null,
    },
  });
}
