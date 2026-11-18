import { NextResponse, type NextRequest } from "next/server";
import { WRITE_COOKIE, verifySessionToken } from "@/lib/write-auth";

/**
 * /write 접근 제한. 세션 쿠키가 없거나 틀리면 /write/login으로 보낸다.
 * 서버 액션(app/write/actions.ts)도 세션을 다시 확인하므로 이건 화면용 1차 관문이다.
 */
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/write/login") return NextResponse.next();

  const ok = await verifySessionToken(req.cookies.get(WRITE_COOKIE)?.value);
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/write/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/write", "/write/:path*"],
};
