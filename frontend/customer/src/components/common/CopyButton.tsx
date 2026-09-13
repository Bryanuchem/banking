import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyButtonProps = {
  value: string;
  label?: string;
};

export default function CopyButton({
  value,
  label = "Copy",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-medium transition"
      style={{
        color: copied ? "var(--success)" : "var(--muted)",
        background: "var(--surface-alt)",
      }}
      aria-label={`${label}: ${value}`}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
