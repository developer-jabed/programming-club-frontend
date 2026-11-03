import { getNewAccessToken } from "@/service/auth/auth.service";
import { getCookie } from "@/service/auth/tokenHandlers";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BASE_API_URL || "http://localhost:5000/api/v1";

// Next.js extended fetch options
type NextFetchRequestConfig = {
  revalidate?: number | false;
  tags?: string[];
};

type ServerFetchOptions = RequestInit & {
  next?: NextFetchRequestConfig;
  cache?: RequestCache;
};

const DEBUG = process.env.NODE_ENV === "development";

const serverFetchHelper = async (
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<Response> => {
  const { headers, next, cache, ...restOptions } = options;

  // Refresh first, so the request below uses the newest token
  // (prevents recursion loop on refresh-token)
  if (endpoint !== "/auth/refresh-token") {
    await getNewAccessToken();
  }

  const accessToken = await getCookie("accessToken");

  const url = `${BACKEND_API_URL}${endpoint}`;
  const method = restOptions.method ?? "GET";

  if (DEBUG) {
    console.log("[serverFetch] BASE URL:", BACKEND_API_URL);
    console.log("[serverFetch] →", method, url, "| has token:", !!accessToken);
  }

  const startedAt = Date.now();

  const response = await fetch(url, {
    headers: {
      Cookie: accessToken ? `accessToken=${accessToken}` : "",
      "Accept-Encoding": "identity",
      ...headers,
    },
    ...restOptions,
    ...(next && { next }),
    ...(cache && { cache }),
  });

  if (DEBUG) {
    console.log(
      "[serverFetch] ←",
      response.status,
      response.statusText,
      `| ${Date.now() - startedAt}ms`,
      "\n   final url:", response.url,
      "\n   redirected:", response.redirected,
      "\n   content-type:", response.headers.get("content-type"),
      "\n   content-length:", response.headers.get("content-length")
    );
  }

  return response;
};

export const serverFetch = {
  get: (
    endpoint: string,
    options: ServerFetchOptions = {}
  ): Promise<Response> =>
    serverFetchHelper(endpoint, { ...options, method: "GET" }),

  post: (
    endpoint: string,
    options: ServerFetchOptions = {}
  ): Promise<Response> =>
    serverFetchHelper(endpoint, { ...options, method: "POST" }),

  put: (
    endpoint: string,
    options: ServerFetchOptions = {}
  ): Promise<Response> =>
    serverFetchHelper(endpoint, { ...options, method: "PUT" }),

  patch: (
    endpoint: string,
    options: ServerFetchOptions = {}
  ): Promise<Response> =>
    serverFetchHelper(endpoint, { ...options, method: "PATCH" }),

  delete: (
    endpoint: string,
    options: ServerFetchOptions = {}
  ): Promise<Response> =>
    serverFetchHelper(endpoint, { ...options, method: "DELETE" }),
};