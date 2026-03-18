import { cookies } from "next/headers";

export function isAuthenticated(): boolean {
  try {
    const cookieStore = cookies();
    const authCookie = cookieStore.get("aisdr-auth");
    return authCookie?.value === "authenticated";
  } catch {
    return false;
  }
}

export function requireAuth(): void {
  if (!isAuthenticated()) {
    throw new Error("Authentication required");
  }
}