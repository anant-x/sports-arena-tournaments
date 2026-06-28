export const ADMIN_COOKIE = "sports_arena_admin";

export function expectedAdminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

export function adminSessionValue() {
  return process.env.ADMIN_SESSION_SECRET || `sports-arena-admin:${expectedAdminPassword()}`;
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  };
}
