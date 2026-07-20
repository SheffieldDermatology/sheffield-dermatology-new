import Link from "next/link";

/** Rendered when a staff member lacks the permission for a section. */
export default function PermissionDenied({
  backHref = "/staff",
  what = "this section",
}: {
  backHref?: string;
  what?: string;
}) {
  return (
    <div className="denied-state">
      <div className="ico" aria-hidden="true" style={{ fontSize: 40 }}>
        ⌀
      </div>
      <h1 style={{ fontFamily: "var(--serif)", fontWeight: 500 }}>Permission denied</h1>
      <p style={{ color: "var(--app-muted)" }}>
        You do not have permission to view {what}. If you believe this is a mistake, please contact
        a system administrator.
      </p>
      <Link className="btn btn-primary" href={backHref} style={{ marginTop: 12 }}>
        Back
      </Link>
    </div>
  );
}
