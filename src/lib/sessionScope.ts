import { getToken } from "next-auth/jwt";
import { headers, cookies } from "next/headers";

export type SessionScope = {
  userId: string;
  role: string;
  isAdmin: boolean;
  isManager: boolean;  // customer-level admin — can reset team passwords
  isViewer: boolean;   // read-only
  /** null = admin sees all; string = scoped to this customer only */
  customerId: string | null;
};

export async function getSessionScope(): Promise<SessionScope | null> {
  const headersList = await headers();
  const cookieStore = await cookies();

  // Build cookie object for getToken (web session cookies)
  const cookieObj: Record<string, string> = {};
  cookieStore.getAll().forEach(c => { cookieObj[c.name] = c.value; });

  // Works for both:
  //   - Web: reads next-auth.session-token cookie
  //   - Mobile: reads Authorization: Bearer <token> header
  const token = await getToken({
    req: {
      headers: Object.fromEntries(headersList.entries()),
      cookies: cookieObj,
    } as any,
    secret: process.env.NEXTAUTH_SECRET!,
  });

  if (!token?.id) return null;

  const role     = (token.role as string) ?? "user";
  const isAdmin   = role === "admin";
  const isManager = role === "manager";
  const isViewer  = role === "viewer";

  return {
    userId:     token.id as string,
    role,
    isAdmin,
    isManager,
    isViewer,
    customerId: isAdmin ? null : (token.customerId as string | null) ?? null,
  };
}
