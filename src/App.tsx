// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthForm from "@/components/AuthForm";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext"; // 🔁 Make sure you include this
import TaskDashboard from "./components/TaskDashboard";
import { TaskProvider } from "./contexts/TaskContext";

const queryClient = new QueryClient();

const App = () => (
 <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TaskProvider> {/* ✅ Add this line */}
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<AuthForm />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <TaskDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </ThemeProvider>
        </TaskProvider> {/* ✅ Close TaskProvider */}
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;