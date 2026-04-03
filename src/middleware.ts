export { default } from "next-auth/middleware";

export const config = {
  // Protect all page routes. API routes are excluded because each one
  // handles its own auth via getSessionScope() and must return JSON,
  // not an HTML redirect (which breaks the mobile app).
  matcher: [
    "/((?!login|forgot-password|reset-password|api|_next/static|_next/image|favicon.ico).*)"],
};
