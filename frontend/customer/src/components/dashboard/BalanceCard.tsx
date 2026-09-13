import {
  Eye,
  EyeOff,
  Info,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

import { formatCurrency } from "@/utils/formatCurrency";

type Props = {
  availableBalance: string;
  heldBalance: string;
  currency: string;
  status: string;
  onRefresh?: () => Promise<unknown> | void;
  isRefreshing?: boolean;
};

export default function BalanceCard({
  availableBalance,
  heldBalance,
  currency,
  onRefresh,
  isRefreshing = false,
}: Props) {
  const [visible, setVisible] = useState(true);
  const [showHeldInfo, setShowHeldInfo] = useState(false);

  return (
    <section
      className="
        relative overflow-hidden rounded-[var(--radius-card)]
        border p-5 sm:p-6 lg:p-7
      "
      style={{
        color: "#fff",
        borderColor:
          "color-mix(in srgb, var(--brand-accent) 30%, transparent)",
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 88%, #0a6b45) 0%, color-mix(in srgb, var(--brand-accent) 72%, #0b6a46) 100%)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -bottom-20 -right-14
          size-56 rounded-[45%] opacity-10
        "
        style={{ background: "#fff" }}
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute bottom-12 right-16
          size-20 rotate-45 rounded-[45%] opacity-10
        "
        style={{ background: "#fff" }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-white/80 sm:text-sm">
                Available balance
              </p>

              {onRefresh ? (
                <button
                  type="button"
                  onClick={() => void onRefresh()}
                  disabled={isRefreshing}
                  className="
                    grid size-7 shrink-0 place-items-center rounded-lg
                    text-white/70 transition
                    hover:bg-white/10 hover:text-white
                    disabled:cursor-wait disabled:opacity-70
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-white/70
                  "
                  aria-label="Refresh account balance"
                  title="Refresh account balance"
                >
                  <RefreshCw
                    size={14}
                    strokeWidth={1.9}
                    className={
                      isRefreshing ? "animate-spin" : undefined
                    }
                  />
                </button>
              ) : null}
            </div>

            <div className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              {visible
                ? formatCurrency(availableBalance, currency)
                : "••••••••"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            className="
              grid size-9 shrink-0 place-items-center rounded-xl
              text-white/80 transition hover:bg-white/10 hover:text-white
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-white/70
            "
            aria-label={visible ? "Hide balances" : "Show balances"}
            title={visible ? "Hide balances" : "Show balances"}
          >
            {visible ? (
              <EyeOff size={18} strokeWidth={1.8} />
            ) : (
              <Eye size={18} strokeWidth={1.8} />
            )}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-sm text-white/80">
            Held balance
          </span>

          <strong className="text-sm font-semibold">
            {visible
              ? formatCurrency(heldBalance, currency)
              : "••••••"}
          </strong>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowHeldInfo((value) => !value)
              }
              className="
                grid size-6 place-items-center rounded-full
                text-white/75 transition hover:bg-white/10
                hover:text-white
              "
              aria-label="What is held balance?"
              aria-expanded={showHeldInfo}
            >
              <Info size={14} />
            </button>

            {showHeldInfo ? (
              <div
                className="
                  absolute left-0 top-8 z-20 w-64
                  rounded-xl border p-3 text-xs leading-5
                  sm:w-72
                "
                style={{
                  color: "var(--text)",
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                Held funds are temporarily reserved for
                withdrawals or transactions that have not
                finished processing.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
