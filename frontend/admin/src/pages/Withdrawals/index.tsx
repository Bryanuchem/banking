import {
  Landmark,
  Search,
  WalletCards,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  getAdminWithdrawals,
} from "@/api/admin";
import ExportCsvButton from "@/components/common/ExportCsvButton";
import Pagination from "@/components/common/Pagination";
import StatusBadge from "@/components/common/StatusBadge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { withdrawalDetailPath } from "@/routes/paths";
import {
  formatCurrency,
  formatDateTime,
} from "@/utils/format";

const LIMIT = 20;

const tabs = [
  ["pending_review", "Awaiting review"],
  ["processing", "Processing"],
  ["completed", "Completed"],
  ["rejected", "Rejected"],
  ["failed", "Failed"],
  ["", "All"],
] as const;

function tone(status: string) {
  if (status === "completed") return "success";
  if (
    status === "rejected" ||
    status === "failed" ||
    status === "cancelled"
  ) {
    return "danger";
  }
  return "warning";
}

function label(status: string) {
  if (
    status === "pending_review" ||
    status === "fee_paid" ||
    status === "pending"
  ) {
    return "Awaiting review";
  }
  return status.replaceAll("_", " ");
}

export default function AdminWithdrawalsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState("pending_review");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [offset, setOffset] = useState(0);

  const q = useDebouncedValue(
    search.trim(),
    350,
  );

  useEffect(() => {
    setOffset(0);
  }, [q, status, startDate, endDate]);

  const params = useMemo(
    () => ({
      q: q || undefined,
      status: status || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      limit: LIMIT,
      offset,
    }),
    [q, status, startDate, endDate, offset],
  );

  const query = useQuery({
    queryKey: [
      "admin",
      "withdrawals",
      params,
    ],
    queryFn: () =>
      getAdminWithdrawals(params),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-[-0.03em]"
            style={{ color: "var(--text)" }}
          >
            Withdrawals
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Review fee-verified requests and manage processing outcomes.
          </p>
        </div>

        <ExportCsvButton
          resource="withdrawals"
          params={{
            q: q || undefined,
            status: status || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
          }}
        />
      </header>

      <div
        className="flex gap-2 overflow-x-auto rounded-xl border p-2"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {tabs.map(([value, text]) => (
          <button
            key={text}
            type="button"
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold"
            style={{
              color:
                status === value
                  ? "#fff"
                  : "var(--muted)",
              background:
                status === value
                  ? "var(--brand-primary)"
                  : "transparent",
            }}
            onClick={() => setStatus(value)}
          >
            {text}
          </button>
        ))}
      </div>

      <section
        className="overflow-hidden rounded-[var(--radius-card)] border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex flex-col gap-3 p-4 xl:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted)" }}
            />
            <input
              value={search}
              placeholder="Search customer, account, destination or withdrawal ID"
              className="h-11 w-full rounded-xl border pl-9 pr-3 text-sm outline-none"
              style={{
                color: "var(--text)",
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <label className="grid gap-1">
            <span
              className="text-[10px] font-medium"
              style={{ color: "var(--muted)" }}
            >
              From
            </span>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              className="h-9 rounded-lg border px-2 text-xs outline-none"
              style={{
                color: "var(--text)",
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
            />
          </label>

          <label className="grid gap-1">
            <span
              className="text-[10px] font-medium"
              style={{ color: "var(--muted)" }}
            >
              To
            </span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              className="h-9 rounded-lg border px-2 text-xs outline-none"
              style={{
                color: "var(--text)",
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
            />
          </label>
        </div>

        {query.isLoading ? (
          <div
            className="border-t p-8 text-center text-sm"
            style={{
              color: "var(--muted)",
              borderColor: "var(--border)",
            }}
          >
            Loading withdrawals...
          </div>
        ) : query.isError ? (
          <div
            className="border-t p-8 text-center text-sm"
            style={{
              color: "var(--danger)",
              borderColor: "var(--border)",
            }}
          >
            Withdrawals could not be loaded.
          </div>
        ) : query.data?.items.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead
                  style={{
                    background:
                      "var(--surface-alt)",
                  }}
                >
                  <tr>
                    {[
                      "Customer",
                      "Amount",
                      "Fee",
                      "Destination",
                      "Submitted",
                      "Status",
                      "",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="border-y px-4 py-3 text-xs font-semibold"
                        style={{
                          color: "var(--muted)",
                          borderColor: "var(--border)",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0"
                      style={{
                        borderColor: "var(--border)",
                      }}
                    >
                      <td className="px-4 py-3">
                        <p
                          className="font-medium"
                          style={{
                            color: "var(--text)",
                          }}
                        >
                          {item.customer.name}
                        </p>
                        <p
                          className="mt-0.5 font-mono text-xs"
                          style={{
                            color: "var(--muted)",
                          }}
                        >
                          {item.account.account_number}
                        </p>
                      </td>
                      <td
                        className="px-4 py-3 font-semibold"
                        style={{
                          color: "var(--text)",
                        }}
                      >
                        {formatCurrency(
                          item.amount,
                          item.currency,
                        )}
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{
                          color: "var(--muted)",
                        }}
                      >
                        {formatCurrency(
                          item.fee_amount,
                          item.currency,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p
                          style={{
                            color: "var(--text)",
                          }}
                        >
                          {item.destination_bank_name}
                        </p>
                        <p
                          className="mt-0.5 text-xs"
                          style={{
                            color: "var(--muted)",
                          }}
                        >
                          ••••
                          {item.destination_account_number.slice(
                            -4,
                          )}
                        </p>
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{
                          color: "var(--muted)",
                        }}
                      >
                        {formatDateTime(
                          item.created_at,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={label(item.status)}
                          tone={tone(item.status)}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="rounded-lg border px-3 py-2 text-xs font-semibold"
                          style={{
                            color:
                              "var(--brand-accent)",
                            borderColor:
                              "var(--border)",
                          }}
                          onClick={() =>
                            navigate(
                              withdrawalDetailPath(
                                item.id,
                              ),
                            )
                          }
                        >
                          {status ===
                          "pending_review"
                            ? "Review"
                            : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="grid gap-3 border-t p-4 lg:hidden"
              style={{
                borderColor: "var(--border)",
              }}
            >
              {query.data.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-xl border p-4 text-left"
                  style={{
                    borderColor: "var(--border)",
                  }}
                  onClick={() =>
                    navigate(
                      withdrawalDetailPath(item.id),
                    )
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="font-medium"
                        style={{
                          color: "var(--text)",
                        }}
                      >
                        {item.customer.name}
                      </p>
                      <p
                        className="mt-1 text-xs"
                        style={{
                          color: "var(--muted)",
                        }}
                      >
                        {item.destination_bank_name}
                        {" ••••"}
                        {item.destination_account_number.slice(
                          -4,
                        )}
                      </p>
                    </div>
                    <WalletCards
                      size={18}
                      style={{
                        color: "var(--muted)",
                      }}
                    />
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p
                        className="text-lg font-semibold"
                        style={{
                          color: "var(--text)",
                        }}
                      >
                        {formatCurrency(
                          item.amount,
                          item.currency,
                        )}
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          color: "var(--muted)",
                        }}
                      >
                        Fee{" "}
                        {formatCurrency(
                          item.fee_amount,
                          item.currency,
                        )}
                      </p>
                    </div>
                    <StatusBadge
                      label={label(item.status)}
                      tone={tone(item.status)}
                    />
                  </div>
                </button>
              ))}
            </div>

            <Pagination
              total={query.data.page.total}
              limit={LIMIT}
              offset={offset}
              onOffsetChange={setOffset}
            />
          </>
        ) : (
          <div
            className="border-t p-10 text-center"
            style={{
              borderColor: "var(--border)",
            }}
          >
            <Landmark
              size={30}
              className="mx-auto"
              style={{ color: "var(--muted)" }}
            />
            <p
              className="mt-3 text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              No withdrawals found
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--muted)" }}
            >
              Adjust the queue, date range or search.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
