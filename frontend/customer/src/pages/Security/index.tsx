import {
  History,
  KeyRound,
  Laptop,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import SecurityCard from "@/components/profile/SecurityCard";
import {
  useSessions,
  useTwoFactorStatus,
} from "@/hooks/useProfileSecurity";

export default function SecurityPage() {
  const twoFactorQ = useTwoFactorStatus();
  const sessionsQ = useSessions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security"
        description="Protect your account and keep it secure."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SecurityCard
          title="Password"
          description="Keep your password current and unique."
          to="/security/password"
          icon={<LockKeyhole size={19} />}
        />

        <SecurityCard
          title="Two-factor authentication"
          description="Add an extra layer of security to sign-in and sensitive actions."
          to="/security/2fa"
          meta={
            twoFactorQ.data?.enabled
              ? "Enabled"
              : "Not enabled"
          }
          icon={<ShieldCheck size={19} />}
        />

        <SecurityCard
          title="Recovery codes"
          description="Use recovery codes if you lose access to your authenticator."
          to="/security/2fa"
          meta={
            twoFactorQ.data?.enabled
              ? `${twoFactorQ.data.recovery_codes_remaining} codes remaining`
              : undefined
          }
          icon={<KeyRound size={19} />}
        />

        <SecurityCard
          title="Active sessions"
          description="Review devices currently signed in to your account."
          to="/security/sessions"
          meta={
            sessionsQ.data
              ? `${sessionsQ.data.length} active`
              : undefined
          }
          icon={<Laptop size={19} />}
        />
      </div>

      <SecurityCard
        title="Security activity"
        description="Review recent customer-safe security events."
        to="/security/activity"
        icon={<History size={19} />}
      />
    </div>
  );
}
