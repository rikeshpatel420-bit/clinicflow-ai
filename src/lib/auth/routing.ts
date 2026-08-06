import type { NextRequest } from "next/server";
import { protectedRoutes } from "@/config/navigation";

export function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function requestedRoute(request: Pick<NextRequest, "nextUrl">) {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}
