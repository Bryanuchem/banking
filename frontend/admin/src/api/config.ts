import { apiClient } from "@/api/client";
import type { PublicConfig } from "@/types/config";

export async function getPublicConfig(): Promise<PublicConfig> {
  return (
    await apiClient.get<PublicConfig>(
      "/config/public",
    )
  ).data;
}
