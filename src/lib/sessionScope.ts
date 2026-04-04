import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { headers, cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

export type SessionScope = {
  userId: string;
  role: string;
  isAdmin: boolean;
  isReseller: boolean; // owns a set of customers, can manage them
  isManager: boolean;  // customer-level admin — can reset team passwords
  isViewer: boolean;   // read-only
  /** null = admin/reseller sees multiple; string = scoped to this customer only */
  customerId: string | null;
  /** set when role === "reseller"; used to filter customers */
  resellerId: string | null;
};

function buildScope(role: string, userId: string, customerId: string | null): SessionScope {
  const isReseller = role === "reseller";
  return {
    userId,
    role,
    isAdmin:    role === "admin",
    isReseller,
    isManager:  role === "manager",
    isViewer:   role === "viewer",
    customerId: (role === "admin" || isReseller) ? null : customerId ?? null,
    resellerId: isReseller ? userId : null,
  };
}

export async function getSessionScope(): Promise<SessionScope | null> {
  // ── Path 1: Standard web session (Server Components, pages, layouts) ──────
  // getServerSession is the reliable way to read NextAuth JWT in App Router.
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const role = session.user.role ?? "user";
    const customerId = session.user.customerId ?? null;
    return buildScope(role, session.user.id, customerId);
  }

  // ── Path 2: Mobile Bearer token (API routes called from the Android app) ──
  // Only attempt getToken when an Authorization header is present; this avoids
  // the synthetic-req unreliability issue in Server Component context.
  const headersList = await headers();
  const authHeader = headersList.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const cookieStore = await cookies();
  const cookieObj: Record<string, string> = {};
  cookieStore.getAll().forEach(c => { cookieObj[c.name] = c.value; });

  const token = await getToken({
    req: {
      headers: Object.fromEntries(headersList.entries()) as Record<string, string>,
      cookies: cookieObj,
    } as unknown as NextRequest,
    secret: process.env.NEXTAUTH_SECRET!,
  });

  if (!token?.id) return null;

  const role = (token.role as string) ?? "user";
  return buildScope(role, token.id as string, (token.customerId as string | null) ?? null);
}
