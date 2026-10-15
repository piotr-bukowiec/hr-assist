import { NextResponse } from "next/server";
import type { NextProxy, NextRequest } from "next/server";
import { authLog, describeJwtExpiry } from "@/utils/debug.utils";

export const proxy: NextProxy = (request: NextRequest) => {
  const accessToken = request.cookies.get("accessToken")?.value;
  const isAuthorized: boolean = !!accessToken;

  const { pathname } = request.nextUrl;

  // Proxy sprawdza tylko OBECNOŚĆ ciasteczka — logujemy też ważność tokenu,
  // żeby zobaczyć przypadek "przepuszczony przez proxy, a backend zwraca 401".
  authLog("proxy", {
    pathname,
    isAuthorized,
    ...describeJwtExpiry(accessToken),
  });

  const isLoginPage: boolean = pathname === "/login";
  const isRootPage: boolean = pathname === "/";

  if (isAuthorized && (isLoginPage || isRootPage)) {
    return NextResponse.redirect(new URL("/employees", request.url));
  }

  if (!isAuthorized && isRootPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isAuthorized && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
