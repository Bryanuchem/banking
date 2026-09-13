import {
  LoaderCircle,
  WalletCards,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/common";
import type { PaymentCheckout } from "@/types/withdrawals";

type CashAppGrant = {
  grantId?: string;
};

type CashAppApprovalEvent = {
  grants?: {
    payment?: CashAppGrant;
  };
};

type CashAppPayInstance = {
  addEventListener: (
    type: string,
    listener: (event: CashAppApprovalEvent) => void,
  ) => void;
  removeEventListener?: (
    type: string,
    listener: (event: CashAppApprovalEvent) => void,
  ) => void;
  customerRequest: (details: {
    referenceId?: string;
    redirectURL: string;
    actions: {
      payment: {
        amount: {
          currency: string;
          value: number;
        };
        scopeId: string;
      };
    };
  }) => Promise<unknown>;
  render: (
    target: string | HTMLElement,
    options?: Record<string, unknown>,
  ) => Promise<unknown>;
};

type CashAppWindow = Window & {
  CashApp?: {
    pay: (options: {
      clientId: string;
    }) => Promise<CashAppPayInstance>;
  };
};

function valueOf(
  source: Record<string, unknown>,
  key: string,
): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

export default function CashAppPayKit({
  checkout,
  submitting,
  error,
  onApproved,
  onCancel,
}: {
  checkout: PaymentCheckout;
  submitting: boolean;
  error?: string;
  onApproved: (grantId: string) => void;
  onCancel: () => void;
}) {
  const mounted = useRef(true);
  const payRef = useRef<CashAppPayInstance | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    mounted.current = true;

    const data = checkout.checkout_data ?? {};
    const scriptUrl = valueOf(
      data,
      "paykit_script_url",
    );
    const clientId = valueOf(data, "client_id");
    const merchantId = valueOf(data, "merchant_id");
    const redirectUrl =
      valueOf(data, "redirect_url") ||
      window.location.href;
    const referenceId =
      valueOf(data, "reference_id") ||
      checkout.reference;

    const rawAmount = data.amount;
    const amount =
      rawAmount &&
      typeof rawAmount === "object" &&
      !Array.isArray(rawAmount)
        ? (rawAmount as Record<string, unknown>)
        : {};

    const currency =
      valueOf(amount, "currency") ||
      checkout.currency;
    const amountValue = Number(amount.value);

    if (
      !scriptUrl ||
      !clientId ||
      !merchantId ||
      !Number.isFinite(amountValue)
    ) {
      setLocalError(
        "Cash App Pay returned incomplete checkout data.",
      );
      setLoading(false);
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptUrl}"]`,
    );
    let addedScript = false;
    let approvalListener:
      | ((event: CashAppApprovalEvent) => void)
      | null = null;

    async function initialize() {
      try {
        const cashWindow =
          window as CashAppWindow;

        if (!cashWindow.CashApp?.pay) {
          throw new Error(
            "Cash App Pay did not load correctly.",
          );
        }

        const pay = await cashWindow.CashApp.pay({
          clientId,
        });
        payRef.current = pay;

        approvalListener = (
          event: CashAppApprovalEvent,
        ) => {
          const grantId =
            event.grants?.payment?.grantId;

          if (!grantId) {
            if (mounted.current) {
              setLocalError(
                "Cash App approved the request but did not return a payment grant.",
              );
            }
            return;
          }

          onApproved(grantId);
        };

        pay.addEventListener(
          "CUSTOMER_REQUEST_APPROVED",
          approvalListener,
        );

        pay.addEventListener(
          "CUSTOMER_REQUEST_DECLINED",
          () => {
            if (mounted.current) {
              setLocalError(
                "Cash App payment approval was declined.",
              );
            }
          },
        );

        pay.addEventListener(
          "CUSTOMER_REQUEST_FAILED",
          () => {
            if (mounted.current) {
              setLocalError(
                "Cash App could not approve this payment.",
              );
            }
          },
        );

        await pay.customerRequest({
          referenceId,
          redirectURL: redirectUrl,
          actions: {
            payment: {
              amount: {
                currency,
                value: amountValue,
              },
              scopeId: merchantId,
            },
          },
        });

        await pay.render("#cash-app-pay", {
          button: {
            shape: "semiround",
            size: "medium",
          },
        });

        if (mounted.current) {
          setLoading(false);
        }
      } catch (requestError) {
        if (!mounted.current) return;

        setLocalError(
          requestError instanceof Error
            ? requestError.message
            : "Cash App Pay could not be initialized.",
        );
        setLoading(false);
      }
    }

    if (script) {
      if (
        (window as CashAppWindow).CashApp?.pay
      ) {
        void initialize();
      } else {
        script.addEventListener(
          "load",
          () => void initialize(),
          { once: true },
        );
      }
    } else {
      script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.addEventListener(
        "load",
        () => void initialize(),
        { once: true },
      );
      script.addEventListener(
        "error",
        () => {
          if (mounted.current) {
            setLocalError(
              "Cash App Pay could not be loaded.",
            );
            setLoading(false);
          }
        },
        { once: true },
      );
      document.head.appendChild(script);
      addedScript = true;
    }

    return () => {
      mounted.current = false;

      if (
        approvalListener &&
        payRef.current?.removeEventListener
      ) {
        payRef.current.removeEventListener(
          "CUSTOMER_REQUEST_APPROVED",
          approvalListener,
        );
      }

      if (addedScript) {
        // Pay Kit is safe to leave loaded for a later payment in the
        // same session. Do not remove the global script here.
      }
    };
  }, [checkout, onApproved]);

  return (
    <div className="mx-auto max-w-lg text-center">
      <div
        className="mx-auto grid size-14 place-items-center rounded-2xl"
        style={{
          color: "var(--brand-accent)",
          background:
            "color-mix(in srgb, var(--brand-accent) 10%, var(--surface))",
        }}
      >
        <WalletCards size={25} />
      </div>

      <h1
        className="mt-4 text-2xl font-semibold"
        style={{ color: "var(--text)" }}
      >
        Pay with Cash App
      </h1>
      <p
        className="mx-auto mt-2 max-w-md text-sm leading-6"
        style={{ color: "var(--muted)" }}
      >
        Approve the processing-fee payment with Cash App Pay. On desktop
        you may see a QR flow; on mobile Cash App may open for approval.
      </p>

      <div
        className="mt-6 rounded-[var(--radius-card)] border p-5"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {loading ? (
          <div
            className="flex items-center justify-center gap-2 py-6 text-sm"
            style={{ color: "var(--muted)" }}
          >
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
            Loading Cash App Pay…
          </div>
        ) : null}

        <div id="cash-app-pay" />

        {localError || error ? (
          <p
            className="mt-4 text-sm"
            style={{ color: "var(--danger)" }}
          >
            {localError || error}
          </p>
        ) : null}

        {submitting ? (
          <div
            className="mt-4 flex items-center justify-center gap-2 text-sm"
            style={{ color: "var(--muted)" }}
          >
            <LoaderCircle
              size={16}
              className="animate-spin"
            />
            Completing payment…
          </div>
        ) : null}

        <Button
          className="mt-4 w-full"
          variant="secondary"
          disabled={submitting}
          onClick={onCancel}
        >
          Back to payment methods
        </Button>
      </div>
    </div>
  );
}
