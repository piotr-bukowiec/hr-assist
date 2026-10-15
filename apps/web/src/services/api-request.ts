import { isValidUrl } from "@/utils/is-valid-url.util";
import { ResponseWrapper } from "@/types/response-wrapper.types";
import { toast } from "sonner";
import { authLog } from "@/utils/debug.utils";

export interface ApiRequestOptions extends RequestInit {
  skipToastOnNetworkError?: boolean;
}

export const apiRequest = async <T>(
  endpointOrUrl: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const { skipToastOnNetworkError = false, ...fetchOptions } = options;

  const isUrl: boolean = isValidUrl(endpointOrUrl);
  const baseUrl: string = process.env.NEXT_PUBLIC_API_URL!;

  const url: string = isUrl
    ? endpointOrUrl
    : new URL(endpointOrUrl, baseUrl).toString();

  const method = fetchOptions.method ?? "GET";
  const isServer = typeof window === "undefined";
  authLog("request start", {
    method,
    url,
    credentials: "include",
    // Na serwerze `credentials: "include"` nic nie robi — ciasteczko trafi do
    // backendu tylko wtedy, gdy ktoś jawnie przekaże nagłówek Cookie.
    ...(isServer
      ? {
          forwardsCookieHeader: Boolean(
            new Headers(fetchOptions.headers).get("cookie"),
          ),
        }
      : { documentReadyState: document.readyState }),
  });

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
      credentials: "include",
    });
  } catch (error: unknown) {
    if (!(error instanceof Error)) {
      console.error("UNKNOWN ERROR WHICH IS NOT AN INSTANCE OF ERROR", error);
      throw error;
    }

    const { message } = error;
    if (
      message.includes("Failed to fetch") ||
      message.includes("NetworkError")
    ) {
      const errorMessage =
        "Brak połączenia z serwerem (backend wyłączony lub zablokowany przez sieć).";

      if (!skipToastOnNetworkError) {
        toast.error(errorMessage);
      }

      throw new Error(errorMessage);
    }
    throw error;
  }

  authLog(
    response.status === 401 ? "request 401 UNAUTHORIZED" : "request end",
    {
      method,
      url,
      status: response.status,
    },
  );

  const { data, ok, errors }: ResponseWrapper<T> = await response.json();

  if (ok) {
    return data;
  } else {
    throw new Error(errors.join(", "));
  }
};
