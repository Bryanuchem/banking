import {
  Activity,
  CheckCircle2,
  Clock3,
  Play,
  RefreshCw,
  ServerCog,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getAdminJobRuns,
  getAdminJobs,
  runAdminJob,
} from "@/api/admin";
import Button from "@/components/common/Button";
import {
  useSnackbar,
} from "@/context/SnackbarContext";
import type {
  AdminJobRun,
} from "@/types/admin";

export default function AdminJobsPage() {
  const client = useQueryClient();
  const snackbar = useSnackbar();

  const jobsQ = useQuery({
    queryKey: ["admin", "jobs"],
    queryFn: getAdminJobs,
    refetchInterval: 15_000,
  });

  const runsQ = useQuery({
    queryKey: ["admin", "jobs", "runs"],
    queryFn: () =>
      getAdminJobRuns({
        limit: 20,
        offset: 0,
      }),
    refetchInterval: 15_000,
  });

  const runM = useMutation({
    mutationFn: runAdminJob,
    onSuccess: (run) => {
      void client.invalidateQueries({
        queryKey: ["admin", "jobs"],
      });
      snackbar.showSnackbar(
        run.status === "failed"
          ? "Job finished with an error."
          : `${prettyName(run.job_name)} finished.`,
        run.status === "failed"
          ? "error"
          : run.status === "warning"
            ? "warning"
            : "success",
      );
    },
    onError: () =>
      snackbar.showSnackbar(
        "The job could not be started.",
        "error",
      ),
  });

  const runAllM = useMutation({
    mutationFn: async () => {
      const names =
        jobsQ.data?.items.map(
          (job) => job.name,
        ) ?? [];

      const results = [];
      for (const name of names) {
        results.push(
          await runAdminJob(name),
        );
      }
      return results;
    },
    onSuccess: (runs) => {
      void client.invalidateQueries({
        queryKey: ["admin", "jobs"],
      });

      const failed = runs.filter(
        (run) =>
          run.status === "failed",
      ).length;
      const warnings = runs.filter(
        (run) =>
          run.status === "warning",
      ).length;

      snackbar.showSnackbar(
        failed
          ? `${runs.length} jobs finished with ${failed} failure${failed === 1 ? "" : "s"}.`
          : warnings
            ? `${runs.length} jobs finished with ${warnings} warning${warnings === 1 ? "" : "s"}.`
            : `All ${runs.length} background jobs finished.`,
        failed
          ? "error"
          : warnings
            ? "warning"
            : "success",
      );
    },
    onError: () =>
      snackbar.showSnackbar(
        "Run all stopped because a job could not be started.",
        "error",
      ),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-[-0.03em]"
            style={{ color: "var(--text)" }}
          >
            Background operations
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Scheduled verification, reconciliation, cleanup and monitoring jobs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              void jobsQ.refetch();
              void runsQ.refetch();
            }}
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw size={15} />
              Refresh
            </span>
          </Button>

          <Button
            loading={runAllM.isPending}
            disabled={
              runAllM.isPending ||
              runM.isPending ||
              !jobsQ.data?.items.length
            }
            onClick={() =>
              runAllM.mutate()
            }
          >
            <span className="inline-flex items-center gap-2">
              <Play size={15} />
              Run all
            </span>
          </Button>
        </div>
      </header>

      <section
        className="flex items-start gap-3 rounded-2xl border p-4"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{
            background: "var(--surface-alt)",
            color:
              jobsQ.data?.worker_enabled === false
                ? "var(--warning)"
                : "var(--success)",
          }}
        >
          <ServerCog size={19} />
        </span>

        <div>
          <p
            className="font-semibold"
            style={{ color: "var(--text)" }}
          >
            Worker scheduler{" "}
            {jobsQ.data?.worker_enabled === false
              ? "disabled"
              : "enabled"}
          </p>
          <p
            className="mt-1 text-sm leading-6"
            style={{ color: "var(--muted)" }}
          >
            Scheduled background operations are managed from this page.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {jobsQ.data?.items.map((job) => (
          <article
            key={job.name}
            className="rounded-2xl border p-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className="grid size-10 place-items-center rounded-xl"
                style={{
                  background: "var(--surface-alt)",
                  color: statusColor(
                    job.last_run?.status,
                  ),
                }}
              >
                <Activity size={18} />
              </span>

              <Status
                value={
                  job.last_run?.status ??
                  "never run"
                }
              />
            </div>

            <h2
              className="mt-4 font-semibold"
              style={{ color: "var(--text)" }}
            >
              {job.label}
            </h2>
            <p
              className="mt-1 min-h-12 text-sm leading-6"
              style={{ color: "var(--muted)" }}
            >
              {job.description}
            </p>

            <dl className="mt-4 space-y-2 text-xs">
              <Row
                label="Schedule"
                value={formatInterval(
                  job.interval_seconds,
                )}
              />
              <Row
                label="Last run"
                value={
                  job.last_run
                    ? new Date(
                        job.last_run.started_at,
                      ).toLocaleString()
                    : "Never"
                }
              />
              <Row
                label="Next due"
                value={
                  job.next_run_at
                    ? new Date(
                        job.next_run_at,
                      ).toLocaleString()
                    : "As soon as runner starts"
                }
              />
              <Row
                label="Processed"
                value={String(
                  job.last_run?.items_processed ??
                    0,
                )}
              />
            </dl>

            {job.last_run?.error_message ? (
              <p
                className="mt-3 rounded-lg border p-2 text-xs leading-5"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--danger) 35%, var(--border))",
                  color: "var(--danger)",
                }}
              >
                {job.last_run.error_message}
              </p>
            ) : null}

            <Button
              className="mt-4 w-full"
              variant="secondary"
              loading={
                runM.isPending &&
                runM.variables === job.name
              }
              disabled={
                runM.isPending ||
                runAllM.isPending
              }
              onClick={() =>
                runM.mutate(job.name)
              }
            >
              <span className="inline-flex items-center gap-2">
                <Play size={14} />
                Run now
              </span>
            </Button>
          </article>
        ))}
      </div>

      <section
        className="overflow-hidden rounded-2xl border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="border-b p-4"
          style={{ borderColor: "var(--border)" }}
        >
          <h2
            className="font-semibold"
            style={{ color: "var(--text)" }}
          >
            Recent runs
          </h2>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--muted)" }}
          >
            Latest scheduled and manual job executions.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead
              style={{
                background: "var(--surface-alt)",
                color: "var(--muted)",
              }}
            >
              <tr>
                {[
                  "Job",
                  "Started",
                  "Trigger",
                  "Processed",
                  "Failed",
                  "Status",
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
              {runsQ.data?.items.map((run) => (
                <RunRow
                  key={run.id}
                  run={run}
                />
              ))}
            </tbody>
          </table>
        </div>

        {!runsQ.data?.items.length ? (
          <div
            className="p-8 text-center text-sm"
            style={{ color: "var(--muted)" }}
          >
            No job runs have been recorded yet.
          </div>
        ) : null}
      </section>
    </div>
  );
}

function RunRow({
  run,
}: {
  run: AdminJobRun;
}) {
  return (
    <tr
      className="border-t"
      style={{ borderColor: "var(--border)" }}
    >
      <td
        className="px-4 py-3 font-medium"
        style={{ color: "var(--text)" }}
      >
        {prettyName(run.job_name)}
      </td>
      <td
        className="px-4 py-3 text-xs"
        style={{ color: "var(--muted)" }}
      >
        {new Date(
          run.started_at,
        ).toLocaleString()}
      </td>
      <td
        className="px-4 py-3 capitalize"
        style={{ color: "var(--muted)" }}
      >
        {run.trigger}
      </td>
      <td
        className="px-4 py-3"
        style={{ color: "var(--text)" }}
      >
        {run.items_processed}
      </td>
      <td
        className="px-4 py-3"
        style={{
          color:
            run.items_failed > 0
              ? "var(--warning)"
              : "var(--muted)",
        }}
      >
        {run.items_failed}
      </td>
      <td className="px-4 py-3">
        <Status value={run.status} />
      </td>
    </tr>
  );
}

function Status({
  value,
}: {
  value: string;
}) {
  const Icon =
    value === "completed"
      ? CheckCircle2
      : value === "failed"
        ? XCircle
        : value === "warning"
          ? TriangleAlert
          : Clock3;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold capitalize"
      style={{
        color: statusColor(value),
        background: "var(--surface-alt)",
      }}
    >
      <Icon size={13} />
      {value.replaceAll("_", " ")}
    </span>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt style={{ color: "var(--muted)" }}>
        {label}
      </dt>
      <dd
        className="text-right font-medium"
        style={{ color: "var(--text)" }}
      >
        {value}
      </dd>
    </div>
  );
}

function statusColor(
  value?: string,
) {
  if (value === "completed") {
    return "var(--success)";
  }
  if (value === "warning") {
    return "var(--warning)";
  }
  if (value === "failed") {
    return "var(--danger)";
  }
  return "var(--muted)";
}

function prettyName(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatInterval(seconds: number) {
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return `Every ${hours} hour${hours === 1 ? "" : "s"}`;
  }
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `Every ${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  return `Every ${seconds} seconds`;
}
