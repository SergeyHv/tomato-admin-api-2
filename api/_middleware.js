import { NextResponse } from "next/server";

export const config = {
  matcher: "/api/:path*",
};

export function middleware(req) {
  const res = NextResponse.next();

  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "admin-key, content-type");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: res.headers
    });
  }

  return res;
}
