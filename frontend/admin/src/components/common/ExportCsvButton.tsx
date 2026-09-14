import { Download } from "lucide-react";
import { useState } from "react";

import {
  exportAdminCsv,
  type AdminCsvResource,
} from "@/api/admin";
import { useSnackbar } from "@/context/SnackbarContext";

export default function ExportCsvButton({
  resource,
  params = {},
}: {
  resource: AdminCsvResource;
  params?: Record<string, string | undefined>;
}) {
  const snackbar = useSnackbar();
  const [loading, setLoading] = useState(false);

  async function exportCsv() {
    setLoading(true);
    try {
      const { blob, filename } =
        await exportAdminCsv(resource, params);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      snackbar.showSnackbar(
        `${filename} exported.`,
        "success",
      );
    } catch {
      snackbar.showSnackbar(
        "CSV export could not be created.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold disabled:opacity-60"
      style={{
        color: "var(--text)",
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
      disabled={loading}
      onClick={() => void exportCsv()}
    >
      <Download size={15} />
      {loading ? "Exporting..." : "Export CSV"}
    </button>
  );
}
