import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import PasswordRequirements from "@/components/auth/PasswordRequirements";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import PasswordInput from "@/components/common/PasswordInput";
import { useSnackbar } from "@/context/SnackbarContext";
import { useChangePassword } from "@/hooks/useProfileSecurity";

export default function ChangePasswordPage() {
  const mutation = useChangePassword();
  const snackbar = useSnackbar();
  const [currentPassword, setCurrentPassword] =
    useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  async function submit() {
    if (newPassword !== confirmPassword) {
      snackbar.error("Passwords do not match.");
      return;
    }

    try {
      await mutation.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      snackbar.success(
        "Password changed. Other sessions were signed out.",
      );
    } catch {
      snackbar.error(
        "We couldn't change your password.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        to="/security"
        className="mb-5 inline-flex items-center gap-2 text-sm"
        style={{ color: "var(--muted)" }}
      >
        <ArrowLeft size={17} />
        Security
      </Link>

      <h1
        className="text-2xl font-semibold"
        style={{ color: "var(--text)" }}
      >
        Change password
      </h1>

      <div
        className="mt-6 rounded-[var(--radius-card)] border p-5"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="space-y-4">
          <FormField
            label="Current password"
            htmlFor="current-password"
          >
            <PasswordInput
              id="current-password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value,
                )
              }
            />
          </FormField>

          <FormField
            label="New password"
            htmlFor="new-password"
          >
            <PasswordInput
              id="new-password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
            />
          </FormField>

          <PasswordRequirements
            password={newPassword}
          />

          <FormField
            label="Confirm new password"
            htmlFor="confirm-password"
          >
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
            />
          </FormField>
        </div>

        <Button
          className="mt-5 w-full"
          disabled={
            !currentPassword ||
            !newPassword ||
            newPassword !== confirmPassword
          }
          loading={mutation.isPending}
          onClick={() => void submit()}
        >
          Change password
        </Button>
      </div>
    </div>
  );
}
