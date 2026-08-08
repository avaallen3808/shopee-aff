import crypto from "crypto";
import { type ShopeeGraphQLResponse, type ShopeeGraphQLError } from "./types";

const API_BASE =
  process.env.SHOPEE_API_BASE ?? "https://open-api.affiliate.shopee.co.id/graphql";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const RATE_LIMIT_CODE = 10030;

export class ShopeeAPIError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.name = "ShopeeAPIError";
    this.code = code;
  }
}

export interface ShopeeCredential {
  appId: string;
  secret: string;
}

function computeSignature(
  appId: string,
  timestamp: number,
  payload: string,
  secret: string
): string {
  const data = appId + timestamp + payload + secret;
  return crypto.createHash("sha256").update(data).digest("hex");
}

function buildAuthHeader(
  appId: string,
  timestamp: number,
  signature: string
): string {
  return `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function extractErrorCode(errors: ShopeeGraphQLError[]): number {
  return errors[0]?.code ?? 0;
}

function buildPayload(
  query: string,
  variables?: Record<string, unknown>
): string {
  const body = variables ? { query, variables } : { query };
  return JSON.stringify(body);
}

async function executeRequest<T>(
  credential: ShopeeCredential,
  query: string,
  variables?: Record<string, unknown>,
  attempt = 0
): Promise<T> {
  const payload = buildPayload(query, variables);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = computeSignature(
    credential.appId,
    timestamp,
    payload,
    credential.secret
  );
  const authHeader = buildAuthHeader(credential.appId, timestamp, signature);

  let response: Response;
  try {
    response = await fetchWithTimeout(
      API_BASE,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: payload,
      },
      REQUEST_TIMEOUT_MS
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ShopeeAPIError(0, "Request timeout");
    }
    throw err;
  }

  const json: ShopeeGraphQLResponse<T> = await response.json();

  if (json.errors && json.errors.length > 0) {
    const errorCode = extractErrorCode(json.errors);
    const errorMsg = json.errors[0]?.message ?? "Unknown Shopee API error";

    if (errorCode === RATE_LIMIT_CODE && attempt < MAX_RETRIES) {
      const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return executeRequest<T>(credential, query, variables, attempt + 1);
    }

    throw new ShopeeAPIError(errorCode, errorMsg);
  }

  if (!json.data) {
    throw new ShopeeAPIError(0, "No data returned from Shopee API");
  }

  return json.data;
}

/**
 * Execute a GraphQL query or mutation against the Shopee Affiliate API.
 * Handles SHA256 signature auth, timeout, and rate-limit retry.
 */
export async function shopeeGraphQL<T>(
  credential: ShopeeCredential,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  return executeRequest<T>(credential, query, variables);
}

export function mapShopeeErrorToHttpStatus(code: number): number {
  switch (code) {
    case 10020:
      return 401; // Invalid signature
    case 10035:
      return 403; // No API access
    case 10030:
      return 429; // Rate limited
    case 11001:
      return 400; // Params error
    case 0:
      return 502; // Timeout / no data
    default:
      return 500;
  }
}
