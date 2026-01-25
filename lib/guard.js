// lib/guard.ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function protectPage(allowedRoles) {
  const session = await auth();

  if (!session?.user) redirect("/auth/login");
  if (!allowedRoles.includes(session.user.role)) redirect("/unauthorized");

  return session;
}
