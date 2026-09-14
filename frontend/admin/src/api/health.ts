import { apiClient } from "@/api/client";

export type HealthResponse = {
  status: string;
  database: string;
};

export async function getHealth(): Promise<HealthResponse> {
  return (
    await apiClient.get<HealthResponse>("/health")
  ).data;
}
