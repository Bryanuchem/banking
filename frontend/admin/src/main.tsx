import React from "react";
import ReactDOM from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  BrowserRouter,
} from "react-router-dom";

import App from "@/App";
import { AuthProvider } from "@/context/AuthContext";
import { BrandingProvider } from "@/context/BrandingContext";
import { LayoutProvider } from "@/context/LayoutContext";
import { SnackbarProvider } from "@/context/SnackbarContext";
import SnackbarViewport from "@/components/common/SnackbarViewport";
import AdminStepUpDialog from "@/components/security/AdminStepUpDialog";
import { ThemeProvider } from "@/context/ThemeContext";

import "@/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrandingProvider>
          <AuthProvider>
            <LayoutProvider>
              <SnackbarProvider>
                <BrowserRouter>
                  <App />
                  <SnackbarViewport />
                  <AdminStepUpDialog />
                </BrowserRouter>
              </SnackbarProvider>
            </LayoutProvider>
          </AuthProvider>
        </BrandingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
