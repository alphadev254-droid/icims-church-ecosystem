import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PublicLayout from "@/components/layout/PublicLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Features from "./pages/Features";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Events from "./pages/Events";
import Giving from "./pages/Giving";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/features" element={<Features />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
              </Route>

              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Dashboard routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="members" element={<Members />} />
                <Route path="events" element={<Events />} />
                <Route path="giving" element={<Giving />} />
                <Route path="attendance" element={<PlaceholderPage title="Attendance" description="Track service attendance, view demographics, and monitor trends. Coming soon." />} />
                <Route path="communication" element={<PlaceholderPage title="Communication" description="Send announcements, newsletters, and manage prayer requests. Coming soon." />} />
                <Route path="resources" element={<PlaceholderPage title="Bible Study Resources" description="Access digital Bible, devotionals, study plans, and sermon library. Coming soon." />} />
                <Route path="churches" element={<PlaceholderPage title="Church Administration" description="Manage multi-level church hierarchy and profiles. Coming soon." />} />
                <Route path="performance" element={<PlaceholderPage title="Performance" description="Track KPIs, set targets, and view automated performance reports. Coming soon." />} />
                <Route path="reports" element={<PlaceholderPage title="Reports" description="Generate and export comprehensive reports across all modules. Coming soon." />} />
                <Route path="settings" element={<PlaceholderPage title="Settings" description="Manage your account, preferences, and system configuration. Coming soon." />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
