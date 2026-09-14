import { useRef } from "react";

export default function OtpInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from(
    { length: 6 },
    (_, index) => value[index] ?? "",
  );

  function update(index: number, next: string) {
    if (!/^\d?$/.test(next)) return;

    const chars = digits;
    chars[index] = next;
    const joined = chars.join("").slice(0, 6);
    onChange(joined);

    if (next && index < 5) {
      refs.current[index + 1]?.focus();
    }
  }

  return (
    <div className="grid grid-cols-6 gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          className="h-12 min-w-0 rounded-xl border text-center text-lg font-semibold outline-none"
          style={{
            color: "var(--text)",
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
          onChange={(event) =>
            update(index, event.target.value.slice(-1))
          }
          onKeyDown={(event) => {
            if (
              event.key === "Backspace" &&
              !digit &&
              index > 0
            ) {
              refs.current[index - 1]?.focus();
            }
          }}
          onPaste={(event) => {
            const pasted =
              event.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, 6);

            if (pasted) {
              event.preventDefault();
              onChange(pasted);
              refs.current[
                Math.min(pasted.length, 6) - 1
              ]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
