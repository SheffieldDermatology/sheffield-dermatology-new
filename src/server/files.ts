"use server";

/**
 * Team files server actions (SharePoint-style workspace). Permission-checked
 * server-side, audited, with soft-delete + restore and version history. Files
 * are stored in the encrypted StorageProvider; metadata lives in the database.
 *
 * Patient-specific clinical documents do NOT belong here — those stay attached
 * to the patient record.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { fileLibraries, fileEntries, fileVersions } from "@/lib/db/schema";
import { requirePermission, auditAction } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { createStorageProvider, newStorageKey } from "@/adapters/storage";

export type FileActionState = { ok?: boolean; error?: string };

const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);
const MAX_BYTES = 20 * 1024 * 1024;

async function assertLibraryReadable(libraryId: string, roles: string[]): Promise<boolean> {
  const db = getDb();
  const rows = await db.select().from(fileLibraries).where(eq(fileLibraries.id, libraryId)).limit(1);
  const lib = rows[0];
  if (!lib) return false;
  if (lib.restrictedToRoles.length === 0) return true;
  return lib.restrictedToRoles.some((r) => roles.includes(r));
}

const createFolderSchema = z.object({
  libraryId: z.string().uuid(),
  parentId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1).max(160),
});

export async function createFolder(_prev: FileActionState, formData: FormData): Promise<FileActionState> {
  const user = await requirePermission("files.write");
  const parsed = createFolderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please enter a folder name." };
  if (!(await assertLibraryReadable(parsed.data.libraryId, user.roles))) {
    return { error: "You do not have access to that library." };
  }
  const db = getDb();
  await db.insert(fileEntries).values({
    libraryId: parsed.data.libraryId,
    parentId: parsed.data.parentId || null,
    kind: "folder",
    name: parsed.data.name,
    createdBy: user.id,
  });
  await auditAction(user, "files.folder_created", "file_library", parsed.data.libraryId);
  revalidatePath("/staff/files");
  return { ok: true };
}

export async function uploadTeamFile(_prev: FileActionState, formData: FormData): Promise<FileActionState> {
  const user = await requirePermission("files.write");
  const libraryId = z.string().uuid().safeParse(formData.get("libraryId"));
  const parentRaw = formData.get("parentId");
  const parentId = typeof parentRaw === "string" && parentRaw ? parentRaw : null;
  if (!libraryId.success) return { error: "Invalid library." };
  if (!(await assertLibraryReadable(libraryId.data, user.roles))) {
    return { error: "You do not have access to that library." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose a file." };
  if (file.size > MAX_BYTES) return { error: "Files must be 20 MB or smaller." };
  if (!ALLOWED.has(file.type)) return { error: "That file type is not allowed." };

  const bytes = Buffer.from(await file.arrayBuffer());
  const storage = createStorageProvider();
  const key = newStorageKey();
  await storage.put(key, bytes, file.type);

  const db = getDb();
  const [entry] = await db
    .insert(fileEntries)
    .values({
      libraryId: libraryId.data,
      parentId,
      kind: "file",
      name: file.name.slice(0, 200),
      createdBy: user.id,
    })
    .returning({ id: fileEntries.id });
  const [version] = await db
    .insert(fileVersions)
    .values({
      entryId: entry!.id,
      versionNumber: 1,
      storageKey: key,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedBy: user.id,
    })
    .returning({ id: fileVersions.id });
  await db
    .update(fileEntries)
    .set({ currentVersionId: version!.id })
    .where(eq(fileEntries.id, entry!.id));

  await auditAction(user, "files.uploaded", "file_entry", entry!.id, { sizeBytes: file.size });
  revalidatePath("/staff/files");
  return { ok: true };
}

export async function softDeleteFile(_prev: FileActionState, formData: FormData): Promise<FileActionState> {
  // Deleting requires the elevated files.delete permission.
  const user = await requirePermission("files.delete");
  const entryId = z.string().uuid().safeParse(formData.get("entryId"));
  if (!entryId.success) return { error: "Invalid file." };
  const db = getDb();
  await db
    .update(fileEntries)
    .set({ deletedAt: new Date(), deletedBy: user.id })
    .where(eq(fileEntries.id, entryId.data));
  await auditAction(user, "files.deleted", "file_entry", entryId.data);
  revalidatePath("/staff/files");
  return { ok: true };
}

export async function restoreFile(_prev: FileActionState, formData: FormData): Promise<FileActionState> {
  const user = await requirePermission("files.restore");
  const entryId = z.string().uuid().safeParse(formData.get("entryId"));
  if (!entryId.success) return { error: "Invalid file." };
  const db = getDb();
  await db
    .update(fileEntries)
    .set({ deletedAt: null, deletedBy: null })
    .where(eq(fileEntries.id, entryId.data));
  await auditAction(user, "files.restored", "file_entry", entryId.data);
  revalidatePath("/staff/files");
  return { ok: true };
}

/** Reads a library's live (non-deleted) entries; caller must hold files.read. */
export async function listLibraryEntries(libraryId: string, roles: string[]) {
  if (!rolesHavePermission(roles as never, "files.read")) return [];
  if (!(await assertLibraryReadable(libraryId, roles))) return [];
  const db = getDb();
  return db
    .select()
    .from(fileEntries)
    .where(and(eq(fileEntries.libraryId, libraryId), isNull(fileEntries.deletedAt)))
    .orderBy(fileEntries.kind, fileEntries.name);
}
