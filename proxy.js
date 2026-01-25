// proxy.ts
import { NextResponse } from "next/server";

export function proxy(req) {
  const isLoggedIn = req.cookies.has("authjs.session-token");
  const pathname = req.nextUrl.pathname;

  if(!isLoggedIn && pathname === ('/')){
      return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if(isLoggedIn && pathname === ('/')){
    return NextResponse.redirect(new URL('/dashboard/products', req.url))
  }

  if (!isLoggedIn && pathname.startsWith("/dashboard/products")) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}
