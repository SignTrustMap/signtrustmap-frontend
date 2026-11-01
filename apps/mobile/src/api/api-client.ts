import Constants from "expo-constants";
import { Platform } from "react-native";
import {
    API_URL_NOT_CONFIGURED_MESSAGE,
    formatServerConnectionErrorMessage,
} from "@/constants/message";

// ---------------------------------------------------------------------------
// Auth-expiry emitter
// A minimal, zero-dependency pub/sub used to notify the app when the server
// returns 401/403 so the session can be cleared without coupling the API
// layer to React context.
// ---------------------------------------------------------------------------
type AuthExpiredListener = () => void;

const _authExpiredListeners = new Set<AuthExpiredListener>();

export const authExpiredEmitter = {
    subscribe(listener: AuthExpiredListener) {
        _authExpiredListeners.add(listener);
        return () => _authExpiredListeners.delete(listener);
    },
    emit() {
        for (const fn of _authExpiredListeners) fn();
    },
};

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

import { env } from "@/config/env";

export function apiBaseUrl(): string {
    return env.apiBaseUrl;
}

function errorMessage(body: ApiErrorBody | undefined, status: number) {
    if (Array.isArray(body?.message)) return body.message.join(" ");
    return (
        body?.message ?? body?.error ?? `Yêu cầu thất bại với mã trạng thái ${status}.`
    );
}

export async function apiRequest<T>(
    path: string,
    options: RequestInit = {},
    accessToken?: string,
): Promise<T> {
    const headers = new Headers(options.headers);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    const method = options.method || "GET";
    const baseUrl = apiBaseUrl();
    const fullUrl = `${baseUrl}${path}`;
    console.log(`[ApiClient] -> ${method} ${fullUrl}`);

    let response: Response;
    try {
        response = await fetch(fullUrl, { ...options, headers });
    } catch (error) {
        if (options.signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
            console.warn(`[ApiClient] Request aborted: ${method} ${fullUrl}`);
            throw error;
        }
        const cause = error instanceof Error ? error.message : String(error);
        console.error(`[ApiClient] NETWORK ERROR on ${method} ${fullUrl}:`, {
            cause,
            error,
        });
        throw new Error(formatServerConnectionErrorMessage(baseUrl, cause));
    }

    const text = await response.text();
    let body: unknown;

    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }
    }

    if (!response.ok) {
        const message = errorMessage(body as ApiErrorBody | undefined, response.status);
        console.error(`[ApiClient] <- ${method} ${path} [HTTP ${response.status}] FAILED:`, {
            status: response.status,
            statusText: response.statusText,
            url: fullUrl,
            message,
            body,
        });
        const err = new ApiError(message, response.status);
        // Notify the app that the token is no longer valid so it can redirect
        // to the login screen. Only trigger if auth credentials were provided.
        const hadAuth = Boolean(accessToken) || headers.has("Authorization");
        if (hadAuth && (response.status === 401 || response.status === 403)) {
            authExpiredEmitter.emit();
        }
        throw err;
    }

    console.log(`[ApiClient] <- ${method} ${path} [HTTP ${response.status}] OK`);
    return body as T;
}

export function jsonApiRequest<T>(
    path: string,
    body: unknown,
    accessToken?: string,
    signal?: AbortSignal,
    method = "POST",
): Promise<T> {
    return apiRequest<T>(
        path,
        {
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
            method: method,
            signal,
        },
        accessToken,
    );
}
