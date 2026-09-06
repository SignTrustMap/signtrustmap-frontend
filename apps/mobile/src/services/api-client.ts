import Constants from "expo-constants";
import { Platform } from "react-native";

type ApiErrorBody = {
  error?: string;
  message?: string | string[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function resolveHost(host: string | undefined): string {
  if (!host || host === "localhost" || host === "127.0.0.1") {
    return Platform.OS === "android" ? "10.0.2.2" : "localhost";
  }
  return host;
}

export function apiBaseUrl() {
  const rawConfiguredUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (rawConfiguredUrl) {
    const configuredUrl = rawConfiguredUrl.endsWith("/api/v1")
      ? rawConfiguredUrl
      : `${rawConfiguredUrl}/api/v1`;

    if (
      Platform.OS === "android" &&
      (configuredUrl.includes("//localhost:") ||
        configuredUrl.includes("//127.0.0.1:"))
    ) {
      return configuredUrl
        .replace("//localhost:", "//10.0.2.2:")
        .replace("//127.0.0.1:", "//10.0.2.2:");
    }
    return configuredUrl;
  }

  if (__DEV__) {
    const rawHost = Constants.expoConfig?.hostUri?.split(":")[0];
    const developmentHost = resolveHost(rawHost);
    return `http://${developmentHost}:3000/api/v1`;
  }

  throw new Error("EXPO_PUBLIC_API_URL is not configured.");
}

function errorMessage(body: ApiErrorBody | undefined, status: number) {
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return (
    body?.message ?? body?.error ?? `Request failed with status ${status}.`
  );
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const baseUrl = apiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to connect to backend at ${baseUrl}: ${cause}`);
  }

  const text = await response.text();
  let body: unknown;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = undefined;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      errorMessage(body as ApiErrorBody | undefined, response.status),
      response.status,
    );
  }

  return body as T;
}

export function jsonApiRequest<T>(
  path: string,
  body: unknown,
  accessToken?: string,
): Promise<T> {
  return apiRequest<T>(
    path,
    {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    accessToken,
  );
}
