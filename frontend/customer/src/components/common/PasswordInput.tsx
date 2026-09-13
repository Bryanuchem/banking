import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

import Input from "@/components/common/Input";

export default function PasswordInput(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={`pr-11 ${props.className ?? ""}`}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-[var(--radius-control)]"
        style={{ color: "var(--muted)" }}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <EyeOff size={18} strokeWidth={1.8} />
        ) : (
          <Eye size={18} strokeWidth={1.8} />
        )}
      </button>
    </div>
  );
}
