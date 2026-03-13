import { createI18nMiddleware } from "next-international/middleware";
import { NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "es"],
  defaultLocale: "en",
});

export function middleware(request: NextRequest) {
  const response = I18nMiddleware(request);

  // Forward the current pathname so generateMetadata can build hreflang alternates
  if (response instanceof NextResponse) {
    response.headers.set("x-pathname", request.nextUrl.pathname);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|admin|embed|static|.*\\..*|_next).*)"],
};
