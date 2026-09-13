import StatusBadge from "@/components/common/StatusBadge";
import type { WithdrawalStatus } from "@/types/withdrawals";
import {
  withdrawalStatusLabel,
  withdrawalStatusTone,
} from "@/utils/withdrawal";

export default function WithdrawalStatusBadge({
  status,
}: {
  status: WithdrawalStatus;
}) {
  return (
    <StatusBadge
      tone={withdrawalStatusTone(status)}
      className="justify-center text-center"
    >
      {withdrawalStatusLabel(status)}
    </StatusBadge>
  );
}
