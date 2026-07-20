import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { searchPatients } from "@/lib/staff/data";
import { formatDate } from "@/lib/format";
import PermissionDenied from "@/components/app/PermissionDenied";

export const metadata: Metadata = { title: "Patients" };

export default async function StaffPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "patients.read")) {
    return <PermissionDenied what="patient records" />;
  }

  const { q: rawQuery } = await searchParams;
  const q = (rawQuery ?? "").trim();
  const results = await searchPatients(q);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Records</span>
        <h1>Patients</h1>
        <p>Search the patient directory and open a record to review appointments and documents.</p>
      </div>

      <div className="panel">
        <form method="get" role="search" style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field-block" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
            <label htmlFor="patient-search">Search by name or email</label>
            <input
              id="patient-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="e.g. Smith or jane@example.com"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
        <p className="field-help" style={{ marginTop: 12, marginBottom: 0 }}>
          Records marked <span className="pill pill-new">Demo</span> are demonstration data seeded for
          this environment.
        </p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>{q ? "Search results" : "Recent patients"}</h2>
          <span className="sub">
            {results.length} {results.length === 1 ? "record" : "records"}
          </span>
        </div>

        {results.length === 0 ? (
          <div className="empty-state">
            <div className="ico" aria-hidden="true">
              ◎
            </div>
            <h3>{q ? "No patients match your search" : "No patient records yet"}</h3>
            <p>
              {q
                ? `Nothing found for “${q}”. Try a different name or email address.`
                : "Patient records will appear here once patients register or are added."}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <caption className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                Patient records
              </caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Joined</th>
                </tr>
              </thead>
              <tbody>
                {results.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={`/staff/patients/${p.id}`}
                        style={{ color: "var(--app-ink)", textDecoration: "none", fontWeight: 600 }}
                      >
                        {p.firstName} {p.lastName}
                      </Link>
                      {p.isDemo && (
                        <span className="pill pill-new" style={{ marginLeft: 8 }}>
                          Demo
                        </span>
                      )}
                    </td>
                    <td>{p.email ?? "—"}</td>
                    <td>{p.phone ?? "—"}</td>
                    <td>{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
