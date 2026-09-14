export function apiErrorMessage(
  error: unknown,
  fallback = "Something went wrong.",
) {
  const candidate = error as {
    response?: {
      data?: {
        detail?: string;
      };
    };
    message?: string;
  };

  return (
    candidate.response?.data?.detail ??
    candidate.message ??
    fallback
  );
}
