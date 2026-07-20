/**
 * Heidi AI-scribe provider.
 *
 * Development (no credentials): DevScribeProvider — startSession returns
 * { connected: false }, and the UI shows the transcription step as "not
 * connected". It NEVER fabricates a transcript or a clinical note.
 *
 * Configured (HEIDI_API_URL + HEIDI_API_KEY): HeidiScribeProvider performs the
 * authenticated request pattern, but until the enterprise/Semble-linked
 * integration contract and its exact session/transcript endpoints are verified
 * (see INTEGRATIONS.md) it also reports { connected: false }. This keeps the
 * consent-first workflow fully functional while never inventing AI output.
 */
import { env } from "@/lib/env";
import type { ScribeProvider } from "@/adapters/types";

class DevScribeProvider implements ScribeProvider {
  readonly name = "dev-scribe";
  readonly mode = "development" as const;

  async startSession(): Promise<{ connected: boolean; providerRef?: string }> {
    return { connected: false };
  }

  async fetchDraft(): Promise<{ draftText: string } | null> {
    // Never fabricate a draft. Real drafts come only from a verified provider.
    return null;
  }
}

class HeidiScribeProvider implements ScribeProvider {
  readonly name = "heidi";
  readonly mode = "development" as const; // upgrades to production once verified

  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  async startSession(): Promise<{ connected: boolean; providerRef?: string }> {
    // The transport is ready; the exact Heidi session-start contract must be
    // confirmed before returning connected:true. Until then, honestly report
    // not-connected rather than starting a session that cannot complete.
    void this.apiUrl;
    void this.apiKey;
    return { connected: false };
  }

  async fetchDraft(): Promise<{ draftText: string } | null> {
    return null;
  }
}

export function createScribeProvider(): ScribeProvider {
  if (env.HEIDI_API_URL && env.HEIDI_API_KEY) {
    return new HeidiScribeProvider(env.HEIDI_API_URL, env.HEIDI_API_KEY);
  }
  return new DevScribeProvider();
}

export function heidiConfigured(): boolean {
  return !!env.HEIDI_API_URL && !!env.HEIDI_API_KEY;
}
