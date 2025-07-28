"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield } from "lucide-react";
import { useAdminLogin } from "@/hooks/tanstasck-query/useAdminAuth";
import { useAdminStore } from "@/stores/adminStore";

function AdminLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isSessionValid, clearSession } = useAdminStore();
  const adminLogin = useAdminLogin();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Get return URL from query params, default to /admin
  const returnUrl = searchParams.get("returnUrl")
    ? decodeURIComponent(searchParams.get("returnUrl")!)
    : "/admin";

  // Check authentication state and handle expired sessions
  useEffect(() => {
    const checkAuthState = () => {
      console.log("🔍 Login: Checking authentication state...", {
        isAuthenticated,
        isSessionValid: isSessionValid(),
      });

      setTimeout(() => {
        const sessionValid = isSessionValid();

        // If authenticated with valid session, redirect
        if (isAuthenticated && sessionValid) {
          console.log("✅ Login: Already authenticated, redirecting");
          router.push(returnUrl);
        }
        // If authenticated but session invalid, clear and stay on login
        else if (isAuthenticated && !sessionValid) {
          console.log("🔒 Login: Session expired, clearing auth state");
          clearSession();
          setIsCheckingAuth(false);
        }
        // Not authenticated, show login form
        else {
          console.log("📝 Login: Not authenticated, showing login form");
          setIsCheckingAuth(false);
        }
      }, 100);
    };

    checkAuthState();
  }, [isAuthenticated, isSessionValid, router, returnUrl, clearSession]);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      return;
    }

    adminLogin.mutate(
      { username: username.trim(), password },
      {
        onSuccess: () => {
          router.push(returnUrl);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={adminLogin.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={adminLogin.isPending}
                required
              />
            </div>

            {adminLogin.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {adminLogin.error instanceof Error
                    ? adminLogin.error.message
                    : "Login failed. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                adminLogin.isPending || !username.trim() || !password.trim()
              }
            >
              {adminLogin.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Debug button for development */}
            {/* {process.env.NODE_ENV === 'development' && (
              <Button
                type="button"
                variant="outline"
                className="w-full text-xs"
                onClick={() => {
                  console.log('🧹 Debug: Force clearing all auth data');
                  clearSession();
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                🧹 Clear All Auth Data (Debug)
              </Button>
            )} */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
