import {
  ArrowLeft,
  Laptop,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ErrorState from "@/components/common/ErrorState";
import { useSnackbar } from "@/context/SnackbarContext";
import {
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
} from "@/hooks/useProfileSecurity";
import { formatDateTime } from "@/utils/formatDateTime";

function deviceLabel(agent?: string | null) {
  const value = agent ?? "";
  if (/iphone|android|mobile/i.test(value)) {
    return "Mobile device";
  }
  if (/windows/i.test(value)) {
    return "Chrome on Windows";
  }
  if (/macintosh|mac os/i.test(value)) {
    return "Browser on Mac";
  }
  return "Browser session";
}

export default function SessionsPage() {
  const sessionsQ = useSessions();
  const revokeM = useRevokeSession();
  const revokeOthersM =
    useRevokeOtherSessions();
  const snackbar = useSnackbar();
  const [selected, setSelected] =
    useState<string | null>(null);
  const [allOpen, setAllOpen] =
    useState(false);

  async function revokeSelected() {
    if (!selected) return;
    try {
      await revokeM.mutateAsync(selected);
      setSelected(null);
      snackbar.success("Session signed out.");
    } catch {
      snackbar.error(
        "We couldn't sign out that session.",
      );
    }
  }

  async function revokeOthers() {
    try {
      await revokeOthersM.mutateAsync();
      setAllOpen(false);
      snackbar.success(
        "Other sessions signed out.",
      );
    } catch {
      snackbar.error(
        "We couldn't sign out the other sessions.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
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
        Active sessions
      </h1>

      {sessionsQ.isError ? (
        <div className="mt-6">
          <ErrorState
            title="Could not load sessions"
            description="Try again in a moment."
            onAction={() =>
              void sessionsQ.refetch()
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {(sessionsQ.data ?? []).map(
            (session) => {
              const mobile =
                /iphone|android|mobile/i.test(
                  session.user_agent ?? "",
                );
              const Icon = mobile
                ? Smartphone
                : Laptop;

              return (
                <div
                  key={session.id}
                  className="flex items-center gap-4 rounded-[var(--radius-card)] border p-4"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div
                    className="grid size-10 place-items-center rounded-xl"
                    style={{
                      color: "var(--brand-accent)",
                      background: "var(--surface-alt)",
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className="font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {deviceLabel(
                          session.user_agent,
                        )}
                      </p>
                      {session.current ? (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            color: "var(--success)",
                            background:
                              "color-mix(in srgb, var(--success) 10%, var(--surface))",
                          }}
                        >
                          Current
                        </span>
                      ) : null}
                    </div>

                    <p
                      className="mt-1 truncate text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {session.ip_address ?? "IP unavailable"} ·{" "}
                      {formatDateTime(
                        session.last_seen_at ??
                          session.created_at,
                      )}
                    </p>
                  </div>

                  {!session.current ? (
                    <button
                      type="button"
                      className="text-sm font-medium"
                      style={{ color: "var(--danger)" }}
                      onClick={() =>
                        setSelected(session.id)
                      }
                    >
                      Sign out
                    </button>
                  ) : null}
                </div>
              );
            },
          )}
        </div>
      )}

      {(sessionsQ.data?.filter(
        (item) => !item.current,
      ).length ?? 0) > 0 ? (
        <Button
          className="mt-5 w-full sm:w-auto"
          variant="danger"
          onClick={() => setAllOpen(true)}
        >
          Sign out of all other sessions
        </Button>
      ) : null}

      <ConfirmDialog
        open={Boolean(selected)}
        title="Sign out this device?"
        description="That device will need to sign in again."
        confirmLabel="Sign out"
        destructive
        loading={revokeM.isPending}
        onConfirm={() =>
          void revokeSelected()
        }
        onCancel={() => setSelected(null)}
      />

      <ConfirmDialog
        open={allOpen}
        title="Sign out of all other sessions?"
        description="Your current session will remain active."
        confirmLabel="Sign out other sessions"
        destructive
        loading={revokeOthersM.isPending}
        onConfirm={() => void revokeOthers()}
        onCancel={() => setAllOpen(false)}
      />
    </div>
  );
}
