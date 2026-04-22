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
import Pricing from "./pages/Pricing";
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
import Cells from "./pages/Cells";
import CellDetail from "./pages/CellDetail";
import CellAttendancePage from "./pages/CellAttendancePage";
import TeamMembers from "./pages/TeamMembers";
import Packages from "./pages/Packages";
import Transactions from "./pages/Transactions";
import Withdrawals from "./pages/Withdrawals";
import RequestWithdrawal from "./pages/RequestWithdrawal";
import EventTickets from "./pages/EventTickets";
import PublicEvent from "./pages/PublicEvent";
import PublicCampaign from "./pages/PublicCampaign";
import PaymentCallback from "./pages/PaymentCallback";
import MyTickets from "./pages/MyTickets";
import Subaccount from "./pages/Subaccount";
import NotFound from "./pages/NotFound";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminChurchDetail from "./pages/admin/AdminChurchDetail";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminPackages from "./pages/admin/AdminPackages";

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
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/events/:id" element={<PublicEvent />} />
                <Route path="/giving/:id" element={<PublicCampaign />} />
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
                <Route path="cells" element={<Cells />} />
                <Route path="cells/:id" element={<CellDetail />} />
                <Route path="cells/:id/meetings/:meetingId/attendance" element={<CellAttendancePage />} />
                <Route path="packages" element={<Packages />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="withdrawals" element={<Withdrawals />} />
                <Route path="withdrawals/request" element={<RequestWithdrawal />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="churches/:id" element={<AdminChurchDetail />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="packages" element={<AdminPackages />} />
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
