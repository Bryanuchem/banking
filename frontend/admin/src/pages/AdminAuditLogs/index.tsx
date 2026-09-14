import {
  Activity,
  Braces,
  Clock3,
  Fingerprint,
  Globe2,
  MonitorSmartphone,
  Search,
  UserRound,
} from "lucide-react";
import {
  useQuery,
} from "@tanstack/react-query";
import {
  useState,
} from "react";

import {
  getAdminAuditLogs,
} from "@/api/admin";
import Drawer from "@/components/common/Drawer";
import ExportCsvButton from "@/components/common/ExportCsvButton";
import StatusBadge from "@/components/common/StatusBadge";
import SecurityHeader from "@/components/security/SecurityHeader";
import type {
  AdminAuditLogItemV2,
} from "@/types/admin";

export default function AdminAuditLogsPage() {
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] =
    useState("");
  const [selected, setSelected] =
    useState<AdminAuditLogItemV2 | null>(
      null,
    );

  const params = {
    q: q || undefined,
    action: action || undefined,
    entity_type: entityType || undefined,
    limit: 100,
    offset: 0,
  };

  const query = useQuery({
    queryKey: [
      "admin",
      "audit-logs",
      q,
      action,
      entityType,
    ],
    queryFn: () =>
      getAdminAuditLogs(params),
  });

  return (
    <div className="space-y-5">
      <SecurityHeader
        title="Audit Logs"
        description="Track and review system activities."
        action={
          <ExportCsvButton
            resource="audit-logs"
            params={{
              q: q || undefined,
              action: action || undefined,
              entity_type:
                entityType || undefined,
            }}
          />
        }
      />

      <div
        className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_180px_180px]"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <label className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{
              color: "var(--muted)",
            }}
          />
          <input
            value={q}
            placeholder="Search logs..."
            className="h-10 w-full rounded-lg border bg-transparent pl-9 pr-3 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
            onChange={(event) =>
              setQ(event.target.value)
            }
          />
        </label>

        <input
          value={action}
          placeholder="Action contains..."
          className="h-10 rounded-lg border bg-transparent px-3 text-sm outline-none"
          style={{
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
          onChange={(event) =>
            setAction(event.target.value)
          }
        />

        <input
          value={entityType}
          placeholder="Entity type..."
          className="h-10 rounded-lg border bg-transparent px-3 text-sm outline-none"
          style={{
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
          onChange={(event) =>
            setEntityType(event.target.value)
          }
        />
      </div>

      <div
        className="overflow-hidden rounded-[var(--radius-card)] border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead
              style={{
                background: "var(--surface-alt)",
                color: "var(--muted)",
              }}
            >
              <tr>
                {[
                  "Time",
                  "Actor",
                  "Action",
                  "Entity",
                  "Summary",
                ].map((label) => (
                  <th
                    key={label}
                    className="px-4 py-3 text-xs font-semibold"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {query.data?.items.map(
                (item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t transition hover:bg-[var(--surface-alt)]"
                    style={{
                      borderColor:
                        "var(--border)",
                    }}
                    onClick={() =>
                      setSelected(item)
                    }
                  >
                    <td
                      className="whitespace-nowrap px-4 py-3 text-xs"
                      style={{
                        color:
                          "var(--muted)",
                      }}
                    >
                      {new Date(
                        item.created_at,
                      ).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      <p
                        className="font-medium"
                        style={{
                          color:
                            "var(--text)",
                        }}
                      >
                        {item.actor_name ??
                          "System"}
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          color:
                            "var(--muted)",
                        }}
                      >
                        {item.actor_email ??
                          "system"}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge
                        label={actionLabel(
                          item.action,
                        )}
                        tone={tone(
                          item.action,
                        )}
                      />
                    </td>

                    <td className="px-4 py-3">
                      <p
                        className="text-xs font-medium capitalize"
                        style={{
                          color:
                            "var(--text)",
                        }}
                      >
                        {humanizeKey(
                          item.entity_type ??
                            "system",
                        )}
                      </p>
                      {item.entity_id ? (
                        <p
                          className="mt-1 max-w-[170px] truncate font-mono text-[10px]"
                          title={
                            item.entity_id
                          }
                          style={{
                            color:
                              "var(--muted)",
                          }}
                        >
                          {item.entity_id}
                        </p>
                      ) : null}
                    </td>

                    <td className="max-w-[430px] px-4 py-3">
                      <AuditSummary
                        item={item}
                      />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <div
          className="border-t px-4 py-3 text-xs"
          style={{
            borderColor: "var(--border)",
            color: "var(--muted)",
          }}
        >
          {query.data
            ? `${query.data.total} audit event(s)`
            : "Loading..."}
        </div>
      </div>

      <Drawer
        open={Boolean(selected)}
        title="Audit detail"
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <AuditDetail item={selected} />
        ) : null}
      </Drawer>
    </div>
  );
}

function AuditDetail({
  item,
}: {
  item: AdminAuditLogItemV2;
}) {
  const details = safeDetails(
    item.details ?? {},
  );

  return (
    <div className="space-y-5 p-5">
      <section
        className="rounded-2xl border p-4"
        style={{
          borderColor:
            "color-mix(in srgb, var(--brand-primary) 28%, var(--border))",
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 10%, var(--surface)), var(--surface-alt))",
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl"
            style={{
              color: "var(--brand-accent)",
              background: "var(--surface)",
            }}
          >
            <Activity size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={actionLabel(item.action)}
                tone={tone(item.action)}
              />
              <span
                className="text-xs"
                style={{
                  color: "var(--muted)",
                }}
              >
                {new Date(
                  item.created_at,
                ).toLocaleString()}
              </span>
            </div>
            <p
              className="mt-3 text-sm leading-6"
              style={{
                color: "var(--text)",
              }}
            >
              {summarySentence(item)}
            </p>
          </div>
        </div>
      </section>

      <DetailSection
        title="Overview"
        icon={<Fingerprint size={16} />}
      >
        <DetailGrid>
          <Detail
            label="Audit ID"
            value={item.id}
            mono
          />
          <Detail
            label="Timestamp"
            value={new Date(
              item.created_at,
            ).toLocaleString()}
          />
          <Detail
            label="Actor"
            value={
              item.actor_name ??
              item.actor_email ??
              "System"
            }
          />
          <Detail
            label="Actor email"
            value={
              item.actor_email ?? "system"
            }
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection
        title="Target"
        icon={<Activity size={16} />}
      >
        <DetailGrid>
          <Detail
            label="Entity type"
            value={humanizeKey(
              item.entity_type ?? "System",
            )}
          />
          <Detail
            label="Entity ID"
            value={item.entity_id ?? "—"}
            mono={Boolean(item.entity_id)}
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection
        title="Request context"
        icon={
          <MonitorSmartphone size={16} />
        }
      >
        <DetailGrid>
          <Detail
            label="IP address"
            value={item.ip_address ?? "—"}
            mono={Boolean(item.ip_address)}
          />
          <Detail
            label="User agent"
            value={
              item.user_agent ??
              "Not recorded"
            }
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection
        title="Details"
        icon={<Braces size={16} />}
      >
        {Object.keys(details).length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(details).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border p-3"
                  style={{
                    borderColor:
                      "var(--border)",
                    background:
                      "var(--surface-alt)",
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{
                      color:
                        "var(--muted)",
                    }}
                  >
                    {humanizeKey(key)}
                  </p>
                  <p
                    className={[
                      "mt-2 break-words text-sm",
                      isIdentifierKey(key)
                        ? "font-mono text-xs"
                        : "",
                    ].join(" ")}
                    style={{
                      color:
                        "var(--text)",
                    }}
                  >
                    {formatDetailValue(
                      key,
                      value,
                      details,
                    )}
                  </p>
                </div>
              ),
            )}
          </div>
        ) : (
          <p
            className="text-sm"
            style={{
              color: "var(--muted)",
            }}
          >
            No additional event details were recorded.
          </p>
        )}

        {Object.keys(details).length ? (
          <details
            className="mt-3 rounded-xl border"
            style={{
              borderColor:
                "var(--border)",
            }}
          >
            <summary
              className="cursor-pointer px-3 py-2 text-xs font-semibold"
              style={{
                color:
                  "var(--muted)",
              }}
            >
              View raw details
            </summary>
            <pre
              className="overflow-x-auto border-t p-3 text-[11px] leading-5"
              style={{
                borderColor:
                  "var(--border)",
                color: "var(--muted)",
                background:
                  "var(--surface-alt)",
              }}
            >
              {JSON.stringify(
                details,
                null,
                2,
              )}
            </pre>
          </details>
        ) : null}
      </DetailSection>
    </div>
  );
}

function AuditSummary({
  item,
}: {
  item: AdminAuditLogItemV2;
}) {
  const details = safeDetails(
    item.details ?? {},
  );
  const highlight =
    moneyHighlight(details);
  const reference =
    stringValue(
      details.reference ??
        details.provider_reference ??
        details.external_reference,
    );

  return (
    <div>
      <p
        className="text-sm font-medium"
        style={{ color: "var(--text)" }}
      >
        {summarySentence(item)}
      </p>
      {highlight || reference ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {highlight ? (
            <span
              className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
              style={{
                color: "var(--brand-accent)",
                background:
                  "color-mix(in srgb, var(--brand-primary) 10%, var(--surface-alt))",
              }}
            >
              {highlight}
            </span>
          ) : null}
          {reference ? (
            <span
              className="max-w-[220px] truncate font-mono text-[10px]"
              title={reference}
              style={{
                color: "var(--muted)",
              }}
            >
              Ref {reference}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div
        className="mb-3 flex items-center gap-2"
        style={{
          color: "var(--muted)",
        }}
      >
        {icon}
        <h3
          className="text-xs font-semibold uppercase tracking-[0.1em]"
        >
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function DetailGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2"
      style={{
        borderColor: "var(--border)",
        background: "var(--border)",
      }}
    >
      {children}
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      className="min-w-0 p-3"
      style={{
        background: "var(--surface-alt)",
      }}
    >
      <p
        className="text-[11px] font-medium"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </p>
      <p
        className={[
          "mt-1 break-words text-sm",
          mono ? "font-mono text-xs" : "",
        ].join(" ")}
        style={{ color: "var(--text)" }}
      >
        {value}
      </p>
    </div>
  );
}

function tone(
  action: string,
): "success" | "warning" | "danger" {
  const value = action.toLowerCase();

  if (
    value.includes("disabled") ||
    value.includes("failed") ||
    value.includes("rejected") ||
    value.includes("revoked") ||
    value.includes("deleted")
  ) {
    return "danger";
  }

  if (
    value.includes("created") ||
    value.includes("enabled") ||
    value.includes("completed") ||
    value.includes("approved") ||
    value.includes("credit") ||
    value.includes("promoted")
  ) {
    return "success";
  }

  return "warning";
}

function actionLabel(action: string) {
  const overrides: Record<string, string> = {
    "account.admin_credit": "Admin credit",
    "setting.updated": "Setting updated",
    "administrator.created":
      "Administrator created",
    "administrator.promoted":
      "Customer promoted",
    "administrator.state_updated":
      "Administrator state",
    "session.revoked":
      "Session revoked",
    "session.user_revoked":
      "Sessions revoked",
    "reconciliation.run":
      "Reconciliation",
    "withdrawal.approved":
      "Withdrawal approved",
    "withdrawal.rejected":
      "Withdrawal rejected",
    "withdrawal.completed":
      "Withdrawal completed",
    "withdrawal.failed":
      "Withdrawal failed",
  };

  return (
    overrides[action] ??
    humanizeKey(action.split(".").at(-1) ?? action)
  );
}

function summarySentence(
  item: AdminAuditLogItemV2,
) {
  const details = safeDetails(
    item.details ?? {},
  );
  const action = item.action.toLowerCase();

  if (action === "account.admin_credit") {
    const amount = moneyHighlight(details);
    return amount
      ? `Administrative credit of ${amount} was posted to the account.`
      : "Administrative credit was posted to the account.";
  }

  if (action === "setting.updated") {
    const key = stringValue(
      details.setting_key,
    );
    return key
      ? `Updated ${humanizeKey(key).toLowerCase()}.`
      : "Updated a platform setting.";
  }

  if (
    action.includes("administrator") &&
    action.includes("created")
  ) {
    return "Created a new administrator account.";
  }

  if (
    action.includes("promot")
  ) {
    return "Granted administrator access to an existing customer.";
  }

  if (
    action.includes("session") &&
    action.includes("revok")
  ) {
    return "Revoked an authenticated user session.";
  }

  if (
    action.includes("reconciliation")
  ) {
    const status = stringValue(
      details.status,
    );
    return status
      ? `Reconciliation completed with ${status.toLowerCase()} status.`
      : "Reconciliation completed.";
  }

  if (
    action.includes("withdrawal")
  ) {
    return `${actionLabel(item.action)}.`;
  }

  if (
    action.includes("login") &&
    action.includes("failed")
  ) {
    return "Administrator sign-in attempt failed.";
  }

  if (
    action.includes("login")
  ) {
    return "User signed in successfully.";
  }

  const visible = Object.entries(details)
    .slice(0, 2)
    .map(
      ([key, value]) =>
        `${humanizeKey(key)}: ${formatDetailValue(
          key,
          value,
          details,
        )}`,
    );

  return (
    visible.join(" · ") ||
    `${actionLabel(item.action)} event.`
  );
}

function humanizeKey(value: string) {
  return value
    .replace(/[._-]+/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function safeDetails(
  details: Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(details).filter(
      ([key]) => !isSensitiveKey(key),
    ),
  );
}

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase();
  return [
    "secret",
    "password",
    "token",
    "authorization",
    "credential",
    "api_key",
    "private_key",
  ].some((part) =>
    normalized.includes(part),
  );
}

function isIdentifierKey(key: string) {
  const normalized = key.toLowerCase();
  return (
    normalized === "reference" ||
    normalized.endsWith("_id") ||
    normalized.includes("reference")
  );
}

function stringValue(value: unknown) {
  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value.trim();
  }

  if (
    typeof value === "number"
  ) {
    return String(value);
  }

  return "";
}

function moneyHighlight(
  details: Record<string, unknown>,
) {
  const amount =
    details.amount ??
    details.balance_after ??
    null;
  if (amount == null) return "";

  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  const currency =
    stringValue(details.currency) ||
    "USD";

  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      },
    ).format(numeric);
  } catch {
    return `${numeric.toLocaleString()} ${currency}`;
  }
}

function formatDetailValue(
  key: string,
  value: unknown,
  details: Record<string, unknown>,
) {
  if (value == null) return "—";

  const normalized = key.toLowerCase();

  if (
    normalized.includes("amount") ||
    normalized.includes("balance") ||
    normalized === "fee"
  ) {
    const numeric = Number(value);
    const currency =
      stringValue(details.currency);

    if (Number.isFinite(numeric)) {
      if (currency) {
        try {
          return new Intl.NumberFormat(
            undefined,
            {
              style: "currency",
              currency,
              minimumFractionDigits: 2,
            },
          ).format(numeric);
        } catch {
          return `${numeric.toLocaleString()} ${currency}`;
        }
      }
      return numeric.toLocaleString();
    }
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry))
      .join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(
      value as Record<string, unknown>,
    )
      .map(
        ([childKey, childValue]) =>
          `${humanizeKey(childKey)}: ${String(childValue)}`,
      )
      .join(" · ");
  }

  return String(value);
}
