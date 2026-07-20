import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getDb } from "@/lib/db";
import { fileLibraries } from "@/lib/db/schema";
import { listLibraryEntries } from "@/server/files";
import { formatDate } from "@/lib/format";
import PermissionDenied from "@/components/app/PermissionDenied";
import { UploadPanel, NewFolderForm, SoftDeleteForm } from "./FileForms";

export const metadata: Metadata = { title: "Team files" };

export default async function FilesPage({ searchParams }: { searchParams: Promise<{ lib?: string }> }) {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "files.read")) {
    return <PermissionDenied what="team files" />;
  }
  const db = getDb();
  const allLibraries = await db.select().from(fileLibraries).orderBy(fileLibraries.sortOrder);
  const libraries = allLibraries.filter(
    (l) => l.restrictedToRoles.length === 0 || l.restrictedToRoles.some((r) => user.roles.includes(r as never)),
  );
  const { lib } = await searchParams;
  const selected = libraries.find((l) => l.id === lib) ?? libraries[0];
  const entries = selected ? await listLibraryEntries(selected.id, user.roles) : [];

  const canWrite = rolesHavePermission(user.roles, "files.write");
  const canDelete = rolesHavePermission(user.roles, "files.delete");

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Collaboration</span>
        <h1>Team files</h1>
        <p>Policies, templates and operational documents. Patient clinical documents stay attached to the patient record — not here.</p>
      </div>

      <div className="grid-2">
        <div className="panel" style={{ maxWidth: 280 }}>
          <div className="panel-head"><h2>Libraries</h2></div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {libraries.map((l) => (
              <li key={l.id} style={{ padding: "4px 0" }}>
                <Link href={`/staff/files?lib=${l.id}`} className={selected?.id === l.id ? "active" : ""} style={{ display: "block", padding: "8px 10px", borderRadius: 8, textDecoration: "none", color: "var(--app-ink)", background: selected?.id === l.id ? "var(--app-sky-soft)" : "transparent", fontWeight: selected?.id === l.id ? 700 : 500 }}>
                  ▱ {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ flex: 1 }}>
          {selected && (
            <div className="panel">
              <div className="panel-head">
                <div><h2>{selected.name}</h2><span className="sub">{selected.description}</span></div>
              </div>
              {entries.length === 0 ? (
                <div className="empty-state"><div className="ico" aria-hidden="true">▱</div><h3>This library is empty</h3></div>
              ) : (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Type</th><th>Added</th>{canDelete && <th></th>}</tr></thead>
                    <tbody>
                      {entries.map((e) => (
                        <tr key={e.id}>
                          <td>{e.kind === "folder" ? "📁" : "📄"} {e.name}</td>
                          <td style={{ textTransform: "capitalize" }}>{e.kind}</td>
                          <td>{formatDate(e.createdAt)}</td>
                          {canDelete && <td><SoftDeleteForm entryId={e.id} /></td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {canWrite && selected && (
            <>
              <div className="panel">
                <div className="panel-head"><h2>Upload a file</h2></div>
                <UploadPanel libraryId={selected.id} />
              </div>
              <div className="panel">
                <div className="panel-head"><h2>New folder</h2></div>
                <NewFolderForm libraryId={selected.id} />
              </div>
            </>
          )}

          <div className="panel">
            <p style={{ margin: 0, fontSize: 13, color: "var(--app-muted)" }}>
              Files are encrypted at rest, versioned and permission-controlled. Deleting requires an
              elevated permission and is a soft delete that can be restored.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
