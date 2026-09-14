import {
  Landmark,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  useNavigate,
} from "react-router-dom";

import { getAdminAccounts } from "@/api/admin";
import Pagination from "@/components/common/Pagination";
import ExportCsvButton from "@/components/common/ExportCsvButton";
import StatusBadge from "@/components/common/StatusBadge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { accountDetailPath } from "@/routes/paths";
import {
  formatCurrency,
  formatDate,
} from "@/utils/format";

const LIMIT = 20;

export default function AdminAccountsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);

  const q = useDebouncedValue(
    search.trim(),
    350,
  );

  useEffect(() => {
    setOffset(0);
  }, [q, status]);

  const accountsQ = useQuery({
    queryKey: [
      "admin",
      "accounts",
      q,
      status,
      offset,
    ],
    queryFn: () =>
      getAdminAccounts({
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-[-0.03em]"
            style={{ color: "var(--text)" }}
          >
            Accounts
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Search balances and manage customer account state.
          </p>
        </div>
        <ExportCsvButton resource="accounts" params={{ q: q || undefined, status: status || undefined }} />
      </header>

      <section
        className="overflow-hidden rounded-[var(--radius-card)] border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted)" }}
            />
            <input
              value={search}
              placeholder="Search account number, customer name or email"
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

          <select
            value={status}
            className="h-11 rounded-xl border px-3 text-sm outline-none"
            style={{
              color: "var(--text)",
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {accountsQ.isLoading ? (
          <div
            className="border-t p-8 text-center text-sm"
            style={{
              color: "var(--muted)",
              borderColor: "var(--border)",
            }}
          >
            Loading accounts...
          </div>
        ) : accountsQ.isError ? (
          <div
            className="border-t p-8 text-center text-sm"
            style={{
              color: "var(--danger)",
              borderColor: "var(--border)",
            }}
          >
            Accounts could not be loaded.
          </div>
        ) : accountsQ.data?.items.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead style={{ background: "var(--surface-alt)" }}>
                  <tr>
                    {[
                      "Account",
                      "Customer",
                      "Available",
                      "Held",
                      "Status",
                      "Created",
                      "",
                    ].map((label) => (
                      <th
                        key={label}
                        className="border-y px-4 py-3 text-xs font-semibold"
                        style={{
                          color: "var(--muted)",
                          borderColor: "var(--border)",
                        }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accountsQ.data.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td
                        className="px-4 py-3 font-mono font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {item.account_number}
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className="font-medium"
                          style={{ color: "var(--text)" }}
                        >
                          {item.owner.first_name} {item.owner.last_name}
                        </p>
                        <p
                          className="mt-0.5 text-xs"
                          style={{ color: "var(--muted)" }}
                        >
                          {item.owner.email}
                        </p>
                      </td>
                      <td
                        className="px-4 py-3 font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {formatCurrency(
                          item.available_balance,
                          item.currency,
                        )}
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: "var(--muted)" }}
                      >
                        {formatCurrency(
                          item.held_balance,
                          item.currency,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={item.status}
                          tone={
                            item.status === "active"
                              ? "success"
                              : item.status === "frozen"
                                ? "warning"
                                : "neutral"
                          }
                        />
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="rounded-lg border px-3 py-2 text-xs font-semibold"
                          style={{
                            color: "var(--brand-accent)",
                            borderColor: "var(--border)",
                          }}
                          onClick={() =>
                            navigate(
                              accountDetailPath(item.id),
                            )
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 border-t p-4 lg:hidden" style={{ borderColor: "var(--border)" }}>
              {accountsQ.data.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-xl border p-4 text-left"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() =>
                    navigate(accountDetailPath(item.id))
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="font-mono font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {item.account_number}
                      </p>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {item.owner.first_name} {item.owner.last_name}
                      </p>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        Available{" "}
                        {formatCurrency(
                          item.available_balance,
                          item.currency,
                        )}
                      </p>
                    </div>
                    <Landmark
                      size={18}
                      style={{ color: "var(--muted)" }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span
                      className="text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      Held{" "}
                      {formatCurrency(
                        item.held_balance,
                        item.currency,
                      )}
                    </span>
                    <StatusBadge
                      label={item.status}
                      tone={
                        item.status === "active"
                          ? "success"
                          : item.status === "frozen"
                            ? "warning"
                            : "neutral"
                      }
                    />
                  </div>
                </button>
              ))}
            </div>

            <Pagination
              total={accountsQ.data.page.total}
              limit={LIMIT}
              offset={offset}
              onOffsetChange={setOffset}
            />
          </>
        ) : (
          <div
            className="border-t p-10 text-center"
            style={{ borderColor: "var(--border)" }}
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
              No accounts found
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--muted)" }}
            >
              Adjust the search or status filter.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
