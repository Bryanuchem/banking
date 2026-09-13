import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import SupportCards, { hasConfiguredSupport } from "@/components/support/SupportCards";
import { useBranding } from "@/context/BrandingContext";

export default function SupportPage() {
  const { config } = useBranding();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Choose the support channel that works best for you."
      />

      {hasConfiguredSupport(config) ? (
        <div
          className="rounded-[var(--radius-card)] border p-5 sm:p-6"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <SupportCards title="Contact support" />

          {config?.support_hours ? (
            <p
              className="mt-5 text-sm"
              style={{ color: "var(--muted)" }}
            >
              Support availability: {config.support_hours}
            </p>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="Support is not configured yet"
          description="Support contact details are not available right now. Please check back later."
        />
      )}
    </div>
  );
}
