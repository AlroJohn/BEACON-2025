"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PrivateHeader from "@/components/reuseable/Header/PrivateHeader";
import { AppSidebar } from "@/components/reuseable/Sidebar/app-sidebar";

import { CardContent } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAdminStore } from "@/stores/adminStore";
import { Loader2 } from "lucide-react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isSessionValid, clearSession } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      console.log("🔍 AuthGuard: Checking authentication...", {
        isAuthenticated,
        isSessionValid: isSessionValid(),
        hasRedirected,
      });

      // Give a small delay to allow Zustand to rehydrate from localStorage
      setTimeout(() => {
        const sessionValid = isSessionValid();

        // If session is invalid, clear everything and redirect
        if (!isAuthenticated || !sessionValid) {
          console.log(
            "❌ AuthGuard: Authentication failed, redirecting to login"
          );

          // Ensure we clear the session completely
          if (isAuthenticated && !sessionValid) {
            console.log("🔒 AuthGuard: Clearing expired session");
            clearSession();
          }

          // Prevent multiple redirects
          if (!hasRedirected) {
            setHasRedirected(true);
            const returnUrl = encodeURIComponent(window.location.pathname);
            router.push(`/login?returnUrl=${returnUrl}`);
          }
        } else {
          console.log("✅ AuthGuard: Authentication valid");
          setIsLoading(false);
        }
      }, 150); // Slightly longer delay to ensure Zustand hydration
    };

    checkAuth();
  }, [isAuthenticated, isSessionValid, router, hasRedirected, clearSession]);

  // Show loading while checking auth or while redirecting
  if (isLoading || hasRedirected || !isAuthenticated || !isSessionValid()) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">
            {hasRedirected
              ? "Redirecting to login..."
              : "Verifying authentication..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider className="flex flex-row w-full h-full">
        <AppSidebar />
        <div className="flex h-screen w-full flex-col bg-muted">
          <PrivateHeader />

          <SidebarInset className="bg-muted">
            <main className="w-full h-full">
              <CardContent className="p-0 bg-muted">{children}</CardContent>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
