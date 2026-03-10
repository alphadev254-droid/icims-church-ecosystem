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
import MemberRegister from "./pages/MemberRegister";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Reminders from "./pages/Reminders";
import Giving from "./pages/Giving";
import Donations from "./pages/Donations";
import Attendance from "./pages/Attendance";
import EventAttendance from "./pages/EventAttendance";
import Communication from "./pages/Communication";
import Resources from "./pages/Resources";
import Churches from "./pages/Churches";
import Performance from "./pages/Performance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import UsersManagement from "./pages/UsersManagement";
import RolesManagement from "./pages/RolesManagement";
import Teams from "./pages/Teams";
import TeamMembers from "./pages/TeamMembers";
import Packages from "./pages/Packages";
import Transactions from "./pages/Transactions";
import Withdrawals from "./pages/Withdrawals";
import RequestWithdrawal from "./pages/RequestWithdrawal";
import EventTickets from "./pages/EventTickets";
import PublicEvent from "./pages/PublicEvent";
import PaymentCallback from "./pages/PaymentCallback";
import MyTickets from "./pages/MyTickets";
import Subaccount from "./pages/Subaccount";
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
                <Route path="/events/:id" element={<PublicEvent />} />
              </Route>

              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/member" element={<MemberRegister />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />

              {/* Dashboard routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="events" element={<Events />} />
                <Route path="events/:id/tickets" element={<EventTickets />} />
                <Route path="my-tickets" element={<MyTickets />} />
                <Route path="reminders" element={<Reminders />} />
                <Route path="giving" element={<Giving />} />
                <Route path="donations" element={<Donations />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="event-attendance" element={<EventAttendance />} />
                <Route path="communication" element={<Communication />} />
                <Route path="resources" element={<Resources />} />
                <Route path="churches" element={<Churches />} />
                <Route path="subaccount/:churchId" element={<Subaccount />} />
                <Route path="performance" element={<Performance />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="roles" element={<RolesManagement />} />
                <Route path="teams" element={<Teams />} />
                <Route path="teams/:id/members" element={<TeamMembers />} />
                <Route path="packages" element={<Packages />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="withdrawals" element={<Withdrawals />} />
                <Route path="withdrawals/request" element={<RequestWithdrawal />} />
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
