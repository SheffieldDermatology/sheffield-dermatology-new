/**
 * Semble API client (GraphQL). Semble authenticates with an `x-token` header
 * against a GraphQL endpoint. Beyond that transport detail, this client makes
 * NO assumptions about undocumented queries/mutations — feature code must not
 * guess Semble's schema. Operations that need verified API documentation are
 * gated behind the health/reconcile layer and return typed "not connected"
 * results (see INTEGRATIONS.md).
 */
import { env } from "@/lib/env";

export class SembleError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SembleError";
  }
}

export class SembleClient {
  constructor(
    private readonly apiUrl: string | undefined = env.SEMBLE_API_URL,
    private readonly apiToken: string | undefined = env.SEMBLE_API_TOKEN,
  ) {}

  isConfigured(): boolean {
    return !!this.apiUrl && !!this.apiToken;
  }

  /**
   * Executes a GraphQL request against Semble with rate-limit-aware retries.
   * The caller supplies the query — this client never invents one.
   */
  async request<T = unknown>(
    query: string,
    variables: Record<string, unknown> = {},
    attempt = 0,
  ): Promise<T> {
    if (!this.apiUrl || !this.apiToken) {
      throw new SembleError("Semble API is not configured. See INTEGRATIONS.md.");
    }
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-token": this.apiToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after")) || 2 ** attempt;
      const jitter = 0.5 + (attempt % 2) * 0.25;
      await new Promise((r) => setTimeout(r, retryAfter * 1000 * jitter));
      return this.request<T>(query, variables, attempt + 1);
    }
    if (!response.ok) {
      throw new SembleError(
        `Semble API responded ${response.status}`,
        response.status,
      );
    }
    const body = (await response.json()) as { data?: T; errors?: { message: string }[] };
    if (body.errors && body.errors.length > 0) {
      throw new SembleError(`Semble API error: ${body.errors[0]?.message}`);
    }
    return body.data as T;
  }

  /**
   * Authenticated reachability probe. Uses GraphQL introspection (a standard
   * GraphQL feature, not a guessed Semble query) to confirm the endpoint and
   * token are accepted, without touching any patient data.
   */
  async ping(): Promise<{ reachable: boolean; authAccepted: boolean; detail?: string }> {
    if (!this.isConfigured()) {
      return { reachable: false, authAccepted: false, detail: "Not configured" };
    }
    try {
      await this.request<{ __typename?: string }>("query Ping { __typename }");
      return { reachable: true, authAccepted: true };
    } catch (error) {
      const status = error instanceof SembleError ? error.status : undefined;
      if (status === 401 || status === 403) {
        return { reachable: true, authAccepted: false, detail: "Authentication rejected" };
      }
      return {
        reachable: false,
        authAccepted: false,
        detail: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
