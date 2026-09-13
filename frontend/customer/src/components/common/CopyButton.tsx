import {
  Check,
  Copy,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useSnackbar } from "@/context/SnackbarContext";
import { cn } from "@/utils/cn";

type Props = {
  value: string;
  label?: string;
  successMessage?: string;
  className?: string;
};

export default function CopyButton({
  value,
  label = "Copy",
  successMessage = "Copied to clipboard.",
  className,
}: Props) {
  const snackbar = useSnackbar();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(
      () => setCopied(false),
      1800,
    );

    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      snackbar.success(successMessage);
    } catch {
      snackbar.error(
        "Could not copy to your clipboard.",
      );
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${label}: ${value}`}
      title={copied ? "Copied" : label}
      className={cn(
        `
          grid size-8 shrink-0 place-items-center
          rounded-lg transition
          hover:bg-[var(--surface-alt)]
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-[var(--brand-accent)]
        `,
        className,
      )}
      style={{
        color: copied
          ? "var(--success)"
          : "var(--muted)",
      }}
    >
      {copied ? (
        <Check size={16} strokeWidth={2} />
      ) : (
        <Copy size={16} strokeWidth={1.8} />
      )}
    </button>
  );
}
