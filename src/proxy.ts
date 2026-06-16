import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (pathname.startsWith("/dashboard/client") && token?.role !== "client") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    if (
      pathname.startsWith("/dashboard/dietitian") &&
      token?.role !== "dietitian"
    ) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
