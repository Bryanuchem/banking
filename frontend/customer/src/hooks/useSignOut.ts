import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { logout } from "@/api/auth";
import { useAuthContext } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";

export function useSignOut() {
  const auth = useAuthContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await logout();
      } finally {
        auth.signOut();
      }
    },
    onSuccess: () => {
      queryClient.clear();
      navigate(ROUTES.landing, { replace: true });
    },
    onError: () => {
      queryClient.clear();
      navigate(ROUTES.landing, { replace: true });
    },
  });
}
