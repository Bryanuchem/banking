import axios from "axios";

import type {
  PaymentProviderName,
  WithdrawalStatus,
} from "@/types/withdrawals";

export function withdrawalStatusLabel(
  status: WithdrawalStatus,
): string {
  switch (status) {
    case "awaiting_fee":
      return "Fee required";
    case "fee_paid":
      return "Fee paid";
    case "pending_review":
    case "pending":
      return "Pending review";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    default:
      return status
        .replaceAll("_", " ")
        .replace(/\b\w/g, (value) =>
          value.toUpperCase(),
        );
  }
}

export function withdrawalStatusTone(
  status: WithdrawalStatus,
):
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger" {
  switch (status) {
    case "completed":
      return "success";
    case "awaiting_fee":
    case "fee_paid":
    case "pending_review":
    case "pending":
    case "processing":
      return "warning";
    case "failed":
    case "rejected":
      return "danger";
    case "cancelled":
    default:
      return "neutral";
  }
}

export function canCancelWithdrawal(
  status: WithdrawalStatus,
): boolean {
  return [
    "awaiting_fee",
    "pending_review",
    "pending",
  ].includes(status);
}

export function paymentProviderLabel(
  provider: PaymentProviderName,
): string {
  switch (provider) {
    case "paystack":
      return "Paystack";
    case "stripe":
      return "Stripe";
    case "paypal":
      return "PayPal";
    case "cashapp":
      return "Cash App";
  }
}

export function paymentProviderDescription(
  provider: PaymentProviderName,
): string {
  switch (provider) {
    case "paystack":
      return "Card, bank or supported local methods";
    case "stripe":
      return "Secure card checkout";
    case "paypal":
      return "Pay with your PayPal account";
    case "cashapp":
      return "Approve with Cash App Pay";
  }
}

export function withdrawalErrorMessage(
  error: unknown,
): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (!error.response) {
      return "We couldn't reach the service. Check your connection and try again.";
    }
  }

  return "We couldn't complete that request. Please try again.";
}

export function requiresStepUp(
  error: unknown,
): boolean {
  if (!axios.isAxiosError(error)) return false;

  if (error.response?.status !== 401) return false;

  const detail = error.response?.data?.detail;
  if (typeof detail === "string") {
    return detail
      .toLowerCase()
      .includes("two-factor");
  }

  if (
    detail &&
    typeof detail === "object" &&
    "code" in detail
  ) {
    return (
      String(
        (detail as { code?: unknown }).code,
      ).toLowerCase() === "step_up_required"
    );
  }

  return false;
}
