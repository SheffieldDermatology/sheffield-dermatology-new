/**
 * Authorised document download. The document must belong to the requesting
 * patient AND be a clinic document released to them (not a draft). Patient
 * uploads are not re-served here. Bytes stream from the encrypted store; the
 * URL never exposes the storage key.
 */
import { and, eq } from "drizzle-orm";
import { requirePatient } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { createStorageProvider } from "@/adapters/storage";
import { auditAction } from "@/lib/auth/guards";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requirePatient();
  const { id } = await params;

  const db = getDb();
  const rows = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.patientId, user.patientId)))
    .limit(1);
  const doc = rows[0];
  if (!doc || doc.deletedAt) {
    return new Response("Not found", { status: 404 });
  }
  // Only released clinic documents are downloadable through the portal.
  const released = doc.status === "approved" && doc.releasedToPatientAt;
  if (!released) {
    return new Response("Not available", { status: 403 });
  }

  const storage = createStorageProvider();
  const bytes = await storage.get(doc.storageKey);
  if (!bytes) return new Response("Not found", { status: 404 });

  await auditAction(user, "patient.document_downloaded", "document", doc.id);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
      "Cache-Control": "no-store",
    },
  });
}
