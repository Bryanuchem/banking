import axios from "axios";

export function isStepUpRequired(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  const detail = String(error.response?.data?.detail ?? "").toLowerCase();
  return (
    error.response?.status === 403 &&
    detail.includes("two-factor authorization") &&
    detail.includes("required")
  );
}

export function getTransferErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return "We couldn't complete the transfer. Please try again.";
  }

  const status = error.response?.status;
  const detail = error.response?.data?.detail;
  const text = typeof detail === "string" ? detail : "";
  const lower = text.toLowerCase();

  if (lower.includes("insufficient")) {
    return "Insufficient available balance.";
  }
  if (lower.includes("same account") || lower.includes("your own")) {
    return "You can't send money to your own account.";
  }
  if (status === 404) {
    return "We couldn't find that account.";
  }
  if (status === 423 || lower.includes("frozen") || lower.includes("suspended")) {
    return text || "Transfers are unavailable for this account.";
  }
  if (status === 429) {
    return "Too many transfer attempts. Please try again shortly.";
  }
  if (text) return text;
  if (!error.response) {
    return "We couldn't reach the service. Check your connection and try again.";
  }
  return "We couldn't complete the transfer. Please try again.";
}
