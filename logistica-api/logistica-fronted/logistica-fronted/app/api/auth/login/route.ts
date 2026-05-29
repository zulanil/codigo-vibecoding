import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const djangoRes = await fetch(`${API_BASE}/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!djangoRes.ok) {
    const error = await djangoRes.json();
    return NextResponse.json(error, { status: djangoRes.status });
  }

  const { access, refresh } = (await djangoRes.json()) as {
    access: string;
    refresh: string;
  };

  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ success: true });

  response.cookies.set("access_token", access, {
    httpOnly: false,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 15, // 15 minutos
  });

  response.cookies.set("refresh_token", refresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  return response;
}
