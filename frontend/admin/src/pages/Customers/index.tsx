import {
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getAdminUsers } from "@/api/admin";
import CustomerDrawer from "@/components/customers/CustomerDrawer";
import Pagination from "@/components/common/Pagination";
import ExportCsvButton from "@/components/common/ExportCsvButton";
import StatusBadge from "@/components/common/StatusBadge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  formatDate,
  formatDateTime,
  fullName,
} from "@/utils/format";

const LIMIT = 20;

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const q = useDebouncedValue(
    search.trim(),
    350,
  );

  useEffect(() => {
    setOffset(0);
  }, [q]);

  const usersQ = useQuery({
    queryKey: ["admin", "users", q, offset],
    queryFn: () =>
      getAdminUsers({
        q: q || undefined,
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
            Customers
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Search customer profiles, verification state and account access.
          </p>
        </div>
        <ExportCsvButton resource="customers" params={{ q: q || undefined }} />
      </header>

      <section
        className="overflow-hidden rounded-[var(--radius-card)] border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="p-4">
          <div className="relative max-w-xl">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted)" }}
            />
            <input
              value={search}
              placeholder="Search name, email or phone"
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
        </div>

        {usersQ.isLoading ? (
          <div
            className="border-t p-8 text-center text-sm"
            style={{
              color: "var(--muted)",
              borderColor: "var(--border)",
            }}
          >
            Loading customers...
          </div>
        ) : usersQ.isError ? (
          <div
            className="border-t p-8 text-center text-sm"
            style={{
              color: "var(--danger)",
              borderColor: "var(--border)",
            }}
          >
            Customers could not be loaded.
          </div>
        ) : usersQ.data?.items.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead
                  style={{ background: "var(--surface-alt)" }}
                >
                  <tr>
                    {[
                      "Customer",
                      "Contact",
                      "Status",
                      "Verified",
                      "Joined",
                      "Last login",
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
                  {usersQ.data.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold"
                            style={{
                              color: "var(--brand-secondary)",
                              background: "var(--surface-alt)",
                            }}
                          >
                            {item.first_name[0]}
                            {item.last_name[0]}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="truncate font-medium"
                                style={{ color: "var(--text)" }}
                              >
                                {fullName(item)}
                              </span>
                              {item.is_admin ? (
                                <ShieldCheck
                                  size={14}
                                  style={{
                                    color: "var(--brand-accent)",
                                  }}
                                  aria-label="Administrator"
                                />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p style={{ color: "var(--text)" }}>
                          {item.email}
                        </p>
                        <p
                          className="mt-0.5 text-xs"
                          style={{ color: "var(--muted)" }}
                        >
                          {item.phone || "No phone"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={
                            item.is_active
                              ? "Active"
                              : "Inactive"
                          }
                          tone={
                            item.is_active
                              ? "success"
                              : "danger"
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={
                            item.is_verified
                              ? "Verified"
                              : "Unverified"
                          }
                          tone={
                            item.is_verified
                              ? "success"
                              : "warning"
                          }
                        />
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {formatDate(item.created_at)}
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {formatDateTime(item.last_login_at)}
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
                            setSelectedId(item.id)
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
              {usersQ.data.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-xl border p-4 text-left"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p
                          className="font-medium"
                          style={{ color: "var(--text)" }}
                        >
                          {fullName(item)}
                        </p>
                        {item.is_admin ? (
                          <ShieldCheck
                            size={14}
                            style={{ color: "var(--brand-accent)" }}
                          />
                        ) : null}
                      </div>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {item.email}
                      </p>
                    </div>
                    <UserRound
                      size={18}
                      style={{ color: "var(--muted)" }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge
                      label={
                        item.is_active
                          ? "Active"
                          : "Inactive"
                      }
                      tone={
                        item.is_active
                          ? "success"
                          : "danger"
                      }
                    />
                    <StatusBadge
                      label={
                        item.is_verified
                          ? "Verified"
                          : "Unverified"
                      }
                      tone={
                        item.is_verified
                          ? "success"
                          : "warning"
                      }
                    />
                  </div>
                </button>
              ))}
            </div>

            <Pagination
              total={usersQ.data.page.total}
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
            <UserRound
              size={30}
              className="mx-auto"
              style={{ color: "var(--muted)" }}
            />
            <p
              className="mt-3 text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              No customers found
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--muted)" }}
            >
              Try a different search term.
            </p>
          </div>
        )}
      </section>

      <CustomerDrawer
        userId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
