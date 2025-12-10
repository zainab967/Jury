import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { setUnauthorizedHandler, authTokenStorage } from "@/lib/apiClient";
import Layout from "@/components/layout";
import Dashboard from "./pages/Dashboard";
import Penalties from "./pages/Penalties";
import Activities from "./pages/Activities";
import Expenses from "./pages/Expenses";
import Logs from "./pages/Logs";
import Tiers from "./pages/Tiers";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry once on failure
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: true, // Refetch when component mounts
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});

// Component to handle 401 errors globally
function AuthHandler() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    // Set up global unauthorized handler
    setUnauthorizedHandler(() => {
      authTokenStorage.clear();
      setUser(null);
      navigate("/login", { replace: true });
    });

    // Listen for auth:unauthorized events
    const handleUnauthorized = () => {
      authTokenStorage.clear();
      setUser(null);
      navigate("/login", { replace: true });
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      setUnauthorizedHandler(null);
    };
  }, [navigate, setUser]);

  return null;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="jury-tracker-theme">
        <UserProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <AuthHandler />
              <Routes>
                <Route path="/login" element={
                  <ErrorBoundary>
                    <Login />
                  </ErrorBoundary>
                } />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <ErrorBoundary>
                        <Dashboard />
                      </ErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/penalties" element={
                  <ProtectedRoute requireJury={true}>
                    <Layout>
                      <ErrorBoundary>
                        <Penalties />
                      </ErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/activities" element={
                  <ProtectedRoute requireJury={true}>
                    <Layout>
                      <ErrorBoundary>
                        <Activities />
                      </ErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/expenses" element={
                  <ProtectedRoute requireJury={true}>
                    <Layout>
                      <ErrorBoundary>
                        <Expenses />
                      </ErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/logs" element={
                  <ProtectedRoute requireJury={true}>
                    <Layout>
                      <ErrorBoundary>
                        <Logs />
                      </ErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/tiers" element={
                  <ProtectedRoute requireJury={true}>
                    <Layout>
                      <ErrorBoundary>
                        <Tiers />
                      </ErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={
                  <ErrorBoundary>
                    <NotFound />
                  </ErrorBoundary>
                } />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
          </TooltipProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
