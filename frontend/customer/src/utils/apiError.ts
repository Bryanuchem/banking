import axios from "axios";

type ErrorBody = {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "We couldn't complete that. Please try again.",
): string {
  if (!axios.isAxiosError<ErrorBody>(error)) {
    return fallback;
  }

  const detail = error.response?.data?.detail;
  const message = error.response?.data?.message;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => item?.msg)
      .filter((item): item is string => Boolean(item));
    if (messages.length) {
      return messages.join(" ");
    }
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (!error.response) {
    return "We couldn't reach the service. Check your connection and try again.";
  }

  return fallback;
}

export function isRegistrationDisabledError(error: unknown): boolean {
  if (!axios.isAxiosError<ErrorBody>(error)) {
    return false;
  }

  const detail = error.response?.data?.detail;
  const text = typeof detail === "string" ? detail.toLowerCase() : "";

  return (
    error.response?.status === 403 &&
    (text.includes("registration") || text.includes("disabled"))
  );
}

export function isLockedLoginError(error: unknown): boolean {
  if (!axios.isAxiosError<ErrorBody>(error)) {
    return false;
  }

  const detail = error.response?.data?.detail;
  const text = typeof detail === "string" ? detail.toLowerCase() : "";

  return (
    error.response?.status === 423 ||
    error.response?.status === 429 ||
    text.includes("locked") ||
    text.includes("too many") ||
    text.includes("try again later")
  );
}
