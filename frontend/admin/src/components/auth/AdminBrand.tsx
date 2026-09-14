import { ShieldCheck } from "lucide-react";

import { useBranding } from "@/context/BrandingContext";

export default function AdminBrand() {
  const { config } = useBranding();

  return (
    <div className="flex items-center justify-center gap-3">
      {config?.logo_url ? (
        <img
          src={config.logo_url}
          alt=""
          className="h-10 w-auto max-w-36 object-contain"
        />
      ) : (
        <span
          className="grid size-10 place-items-center rounded-xl"
          style={{
            color: "#fff",
            background: "var(--brand-primary)",
          }}
        >
          <ShieldCheck size={20} />
        </span>
      )}

      <span
        className="text-lg font-semibold"
        style={{ color: "var(--text)" }}
      >
        {config?.brand_short_name ??
          config?.brand_name ??
          "Banking"}
      </span>
    </div>
  );
}
