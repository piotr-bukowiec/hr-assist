import { apiRequest } from "@/services/api-request";
import { NextResponse } from "next/server";

interface SuccessLogoutResponse {
  ok: true;
  data: null;
  statusCode: 204;
  errors: null;
}

export const POST = async () => {
  try {
    await apiRequest<null>("/api/auth/logout", {
      method: "POST",
      skipToastOnNetworkError: true,
    });
  } catch {}

  const response = NextResponse.json<SuccessLogoutResponse>({
    ok: true,
    data: null,
    statusCode: 204,
    errors: null,
  });

  response.cookies.set({
    name: "accessToken",
    value: "",
    maxAge: 0,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
};
