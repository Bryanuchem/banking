import {
  ArrowRight,
  BanknoteArrowDown,
} from "lucide-react";

import EmptyState from "@/components/common/EmptyState";
import type { Withdrawal } from "@/types/withdrawals";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDateTime";
import WithdrawalStatusBadge from "./WithdrawalStatusBadge";

type Props = {
  items: Withdrawal[];
  onSelect: (withdrawal: Withdrawal) => void;
};

export default function WithdrawalList({
  items,
  onSelect,
}: Props) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No withdrawals yet"
        description="Your withdrawal requests will appear here."
      />
    );
  }

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-card)] border"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className="
            flex w-full items-center gap-3 p-4 text-left
            transition hover:bg-[var(--surface-alt)]
          "
          style={{
            borderTop:
              index === 0
                ? undefined
                : "1px solid var(--border)",
          }}
        >
          <div
            className="grid size-10 shrink-0 place-items-center rounded-xl"
            style={{
              color: "var(--brand-accent)",
              background: "var(--surface-alt)",
            }}
          >
            <BanknoteArrowDown size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p
                className="font-medium"
                style={{ color: "var(--text)" }}
              >
                {formatCurrency(
                  item.amount,
                  item.currency,
                )}
              </p>
              <span
                className="text-xs"
                style={{ color: "var(--muted)" }}
              >
                {formatDateTime(item.created_at)}
              </span>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-3">
              <WithdrawalStatusBadge
                status={item.status}
              />
              <ArrowRight
                size={16}
                style={{ color: "var(--muted)" }}
              />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
