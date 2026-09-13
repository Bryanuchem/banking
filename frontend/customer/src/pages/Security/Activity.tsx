import { ArrowLeft, History } from "lucide-react";
import { Link } from "react-router-dom";

import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { useSecurityActivity } from "@/hooks/useProfileSecurity";
import { formatDateTime } from "@/utils/formatDateTime";

export default function SecurityActivityPage() {
  const query = useSecurityActivity();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/security"
        className="mb-5 inline-flex items-center gap-2 text-sm"
        style={{ color: "var(--muted)" }}
      >
        <ArrowLeft size={17} />
        Security
      </Link>

      <h1
        className="text-2xl font-semibold"
        style={{ color: "var(--text)" }}
      >
        Security activity
      </h1>
      <p
        className="mt-1 text-sm"
        style={{ color: "var(--muted)" }}
      >
        Recent customer-safe security events for your account.
      </p>

      <div className="mt-6">
        {query.isError ? (
          <ErrorState
            title="Could not load security activity"
            description="Try again in a moment."
            onAction={() => void query.refetch()}
          />
        ) : (query.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No security activity yet"
            description="Recent security events will appear here."
            icon={<History size={20} />}
          />
        ) : (
          <div
            className="overflow-hidden rounded-[var(--radius-card)] border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            {query.data?.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-2 p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center"
                style={{
                  borderTop:
                    index === 0
                      ? undefined
                      : "1px solid var(--border)",
                }}
              >
                <strong
                  className="text-sm"
                  style={{ color: "var(--text)" }}
                >
                  {item.event}
                </strong>
                <span
                  className="text-sm"
                  style={{ color: "var(--muted)" }}
                >
                  {item.details ?? "Account security event"}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  {formatDateTime(item.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
