import { AlertTriangle } from "lucide-react";

import Button from "@/components/common/Button";

export default function SettingsFooter({
  dirty,
  saving,
  onReset,
  onSave,
}: {
  dirty: boolean;
  saving: boolean;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border p-3 shadow-lg sm:flex-row sm:items-center sm:justify-between"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="flex items-center gap-2 text-xs font-medium"
        style={{
          color: dirty
            ? "var(--warning)"
            : "var(--muted)",
        }}
      >
        <AlertTriangle size={15} />
        {dirty
          ? "You have unsaved changes"
          : "All changes are saved"}
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={!dirty || saving}
          onClick={onReset}
        >
          Reset
        </Button>
        <Button
          disabled={!dirty}
          loading={saving}
          onClick={onSave}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
