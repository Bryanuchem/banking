import {
  ArrowRight,
  Copy,
  LogOut,
  Trash2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import Button from "@/components/common/Button";
import DeleteAccountDialog from "@/components/profile/DeleteAccountDialog";
import FormField from "@/components/common/FormField";
import Input from "@/components/common/Input";
import PageHeader from "@/components/common/PageHeader";
import { useAuthContext } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import {
  useProfile,
  useTwoFactorStatus,
  useUpdateProfile,
} from "@/hooks/useProfileSecurity";
import { useSignOut } from "@/hooks/useSignOut";
import { ROUTES } from "@/routes/paths";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

function initials(
  first?: string | null,
  last?: string | null,
) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`
    .toUpperCase() || "U";
}

export default function ProfilePage() {
  const profileQ = useProfile();
  const updateM = useUpdateProfile();
  const signOut = useSignOut();
  const snackbar = useSnackbar();
  const auth = useAuthContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const twoFactorQ = useTwoFactorStatus();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [firstName, setFirstName] =
    useState("");
  const [lastName, setLastName] =
    useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!profileQ.data) return;
    setFirstName(profileQ.data.first_name ?? "");
    setLastName(profileQ.data.last_name ?? "");
    setPhone(profileQ.data.phone ?? "");
  }, [profileQ.data]);

  const user = profileQ.data;
  const displayName = useMemo(
    () =>
      [user?.first_name, user?.last_name]
        .filter(Boolean)
        .join(" ") || "Customer",
    [user],
  );

  async function saveProfile() {
    try {
      await updateM.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
      });
      snackbar.success("Profile updated.");
    } catch {
      snackbar.error(
        "We couldn't update your profile.",
      );
    }
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div
          className="h-24 animate-pulse rounded-xl"
          style={{ background: "var(--surface-alt)" }}
        />
        <div
          className="h-72 animate-pulse rounded-xl"
          style={{ background: "var(--surface-alt)" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your personal details and account information."
      />

      <section
        className="rounded-[var(--radius-card)] border p-5"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="grid size-14 place-items-center rounded-full text-lg font-semibold"
            style={{
              color: "var(--text)",
              background: "var(--surface-alt)",
            }}
          >
            {initials(
              user.first_name,
              user.last_name,
            )}
          </div>
          <div className="min-w-0">
            <h2
              className="truncate text-lg font-semibold"
              style={{ color: "var(--text)" }}
            >
              {displayName}
            </h2>
            <p
              className="truncate text-sm"
              style={{ color: "var(--muted)" }}
            >
              {user.email}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section
          className="rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <h2
            className="font-semibold"
            style={{ color: "var(--text)" }}
          >
            Personal information
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FormField
              label="First name"
              htmlFor="profile-first-name"
            >
              <Input
                id="profile-first-name"
                value={firstName}
                onChange={(event) =>
                  setFirstName(event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Last name"
              htmlFor="profile-last-name"
            >
              <Input
                id="profile-last-name"
                value={lastName}
                onChange={(event) =>
                  setLastName(event.target.value)
                }
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField
                label="Phone"
                htmlFor="profile-phone"
              >
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="Phone number"
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Email"
                htmlFor="profile-email"
              >
                <Input
                  id="profile-email"
                  value={user.email}
                  disabled
                />
              </FormField>
              <p
                className="mt-1 text-xs"
                style={{ color: "var(--muted)" }}
              >
                Email changes require a separate verification flow.
              </p>
            </div>
          </div>

          <Button
            className="mt-5 w-full sm:w-auto"
            loading={updateM.isPending}
            onClick={() => void saveProfile()}
          >
            Save changes
          </Button>
        </section>

        <div className="space-y-5">
          <section
            className="rounded-[var(--radius-card)] border p-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <h2
              className="font-semibold"
              style={{ color: "var(--text)" }}
            >
              Account information
            </h2>

            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt style={{ color: "var(--muted)" }}>
                  Account number
                </dt>
                <dd className="mt-1 flex items-center justify-between gap-3">
                  <strong style={{ color: "var(--text)" }}>
                    {user.account_number}
                  </strong>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs"
                    style={{
                      color: "var(--brand-accent)",
                    }}
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        user.account_number ?? "",
                      );
                      snackbar.success(
                        "Account number copied.",
                      );
                    }}
                  >
                    <Copy size={13} />
                    Copy
                  </button>
                </dd>
              </div>

              <div>
                <dt style={{ color: "var(--muted)" }}>
                  Currency
                </dt>
                <dd
                  className="mt-1 font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {user.currency}
                </dd>
              </div>

              <div>
                <dt style={{ color: "var(--muted)" }}>
                  Account status
                </dt>
                <dd
                  className="mt-1 font-medium"
                  style={{ color: "var(--success)" }}
                >
                  {user.is_active ? "Active" : "Restricted"}
                </dd>
              </div>
            </dl>
          </section>

          <Link
            to="/security"
            className="flex items-center gap-3 rounded-[var(--radius-card)] border p-4"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="grid size-10 place-items-center rounded-xl"
              style={{
                color: "var(--brand-accent)",
                background: "var(--surface-alt)",
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div className="flex-1">
              <p
                className="font-medium"
                style={{ color: "var(--text)" }}
              >
                Security
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--muted)" }}
              >
                Password, 2FA, sessions
              </p>
            </div>
            <ArrowRight
              size={17}
              style={{ color: "var(--muted)" }}
            />
          </Link>

          <button
            type="button"
            onClick={() => signOut.mutate()}
            className="flex w-full items-center gap-3 rounded-[var(--radius-card)] border p-4 text-left"
            style={{
              color: "var(--danger)",
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <LogOut size={18} />
            <span className="font-medium">
              Sign out
            </span>
          </button>


          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="flex w-full items-center gap-3 rounded-[var(--radius-card)] border p-4 text-left"
            style={{
              color: "var(--danger)",
              background:
                "color-mix(in srgb, var(--danger) 5%, var(--surface))",
              borderColor:
                "color-mix(in srgb, var(--danger) 28%, var(--border))",
            }}
          >
            <Trash2 size={18} />
            <div>
              <span className="font-medium">
                Delete banking account
              </span>
              <p
                className="mt-0.5 text-xs"
                style={{ color: "var(--muted)" }}
              >
                Requires a zero balance. Financial history is preserved.
              </p>
            </div>
          </button>
        </div>
      </div>
      <DeleteAccountDialog
        open={deleteOpen}
        twoFactorEnabled={Boolean(
          twoFactorQ.data?.enabled,
        )}
        onCancel={() => setDeleteOpen(false)}
        onDeleted={() => {
          auth.signOut();
          queryClient.clear();
          navigate(ROUTES.landing, {
            replace: true,
          });
        }}
      />
    </div>
  );
}
