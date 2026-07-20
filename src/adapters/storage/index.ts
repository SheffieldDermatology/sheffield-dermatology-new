/**
 * Storage provider adapter.
 *
 * Development / local: files are stored server-side under var/storage,
 * encrypted at rest with AES-256-GCM (key derived from SESSION_SECRET), under
 * random hex keys so path traversal is impossible and file names never leak.
 * This is a real, private-to-the-server store — not browser localStorage.
 *
 * Production options (microsoft-graph, s3) are declared as stubs that throw a
 * clear "not configured" error pointing to INTEGRATIONS.md, so the interface
 * is complete and ready to wire once the clinic supplies credentials.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import { sessionSecret } from "@/lib/env";
import type { StorageProvider } from "@/adapters/types";

const STORAGE_ROOT = path.join(process.cwd(), "var", "storage");

function encryptionKey(): Buffer {
  return createHash("sha256").update(`storage:${sessionSecret()}`).digest();
}

/** Storage keys are random hex only; reject anything else defensively. */
function safeKeyPath(key: string): string {
  if (!/^[a-f0-9]{16,128}$/.test(key)) {
    throw new Error("Invalid storage key");
  }
  return path.join(STORAGE_ROOT, `${key}.enc`);
}

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local-encrypted";
  readonly mode = "development" as const;

  async put(key: string, data: Buffer, _contentType: string): Promise<void> {
    await fs.mkdir(STORAGE_ROOT, { recursive: true });
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
    const enc = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Layout: [12-byte iv][16-byte tag][ciphertext]
    await fs.writeFile(safeKeyPath(key), Buffer.concat([iv, tag, enc]));
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const blob = await fs.readFile(safeKeyPath(key));
      const iv = blob.subarray(0, 12);
      const tag = blob.subarray(12, 28);
      const enc = blob.subarray(28);
      const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(enc), decipher.final()]);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(safeKeyPath(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(safeKeyPath(key));
      return true;
    } catch {
      return false;
    }
  }
}

class NotConfiguredStorageProvider implements StorageProvider {
  readonly mode = "disabled" as const;
  constructor(readonly name: string) {}
  private fail(): never {
    throw new Error(
      `Storage provider "${this.name}" is selected but not configured. See INTEGRATIONS.md for the required credentials.`,
    );
  }
  async put(): Promise<void> {
    this.fail();
  }
  async get(): Promise<Buffer | null> {
    this.fail();
  }
  async delete(): Promise<void> {
    this.fail();
  }
  async exists(): Promise<boolean> {
    this.fail();
  }
}

export function createStorageProvider(): StorageProvider {
  switch (env.STORAGE_PROVIDER) {
    case "microsoft-graph":
      return new NotConfiguredStorageProvider("microsoft-graph");
    case "s3":
      return new NotConfiguredStorageProvider("s3");
    case "local":
    default:
      return new LocalStorageProvider();
  }
}

/** Generates a fresh random storage key. */
export function newStorageKey(): string {
  return randomBytes(24).toString("hex");
}
