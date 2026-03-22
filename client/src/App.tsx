import { Suspense, lazy } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { OfflineBanner } from "@/components/shared/OfflineBanner";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AnalyzePage = lazy(() => import("./pages/AnalyzePage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const AnalysisHistory = lazy(() => import("./pages/AnalysisHistory"));
const READMELibrary = lazy(() => import("./pages/READMELibrary"));
const SignInPage = lazy(() => import("./pages/SignInPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const UpgradePage = lazy(() => import("./pages/UpgradePage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MotionConfig reducedMotion="user">
      <ErrorBoundary title="App crashed">
        <AuthProvider>
          <AnalysisProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <OfflineBanner />
              <BrowserRouter>
                <Suspense
                  fallback={
                    <div className="min-h-screen bg-background flex items-center justify-center">
                      <div className="text-sm text-muted-foreground">Loading…</div>
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/signin" element={<SignInPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route
                      path="/analyze"
                      element={
                        <ProtectedRoute>
                          <AnalyzePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/results/:analysisId"
                      element={
                        <ProtectedRoute>
                          <ResultsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/history"
                      element={
                        <ProtectedRoute>
                          <AnalysisHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/readmes"
                      element={
                        <ProtectedRoute>
                          <READMELibrary />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <AccountSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/upgrade"
                      element={
                        <ProtectedRoute>
                          <UpgradePage />
                        </ProtectedRoute>
                      }
                    />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </AnalysisProvider>
        </AuthProvider>
      </ErrorBoundary>
    </MotionConfig>
  </QueryClientProvider>
);

export default App;