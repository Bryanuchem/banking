import {
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
};

export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
}: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const chars = Array.from(
    { length },
    (_, index) => value[index] ?? "",
  );

  function update(index: number, next: string) {
    const digit = next.replace(/\D/g, "").slice(-1);
    const parts = chars.slice();
    parts[index] = digit;
    onChange(parts.join("").slice(0, length));

    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function keyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key === "Backspace" &&
      !chars[index] &&
      index > 0
    ) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div
      className="
        grid grid-cols-6 gap-1.5
        sm:gap-2
      "
    >
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={char}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digit ${index + 1}`}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update(index, event.target.value)
          }
          onKeyDown={(event) => keyDown(index, event)}
          className="
            min-w-0
            h-11 rounded-xl border
            text-center text-sm font-semibold
            outline-none transition
            focus:ring-2
            sm:h-12 sm:text-base
            lg:h-13
          "
          style={{
            background: "var(--surface)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
        />
      ))}
    </div>
  );
}
