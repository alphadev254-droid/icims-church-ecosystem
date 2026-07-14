import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PublicLayout from "@/components/layout/PublicLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";

// ── Lazy-loaded page components ──────────────────────────────────────
const Index = lazy(() => import("./pages/Index"));
const Features = lazy(() => import("./pages/Features"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const MemberRegister = lazy(() => import("./pages/MemberRegister"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Events = lazy(() => import("./pages/Events"));
const Reminders = lazy(() => import("./pages/Reminders"));
const Giving = lazy(() => import("./pages/Giving"));
const Donations = lazy(() => import("./pages/Donations"));
const Pledges = lazy(() => import("./pages/Pledges"));
const PledgeDetail = lazy(() => import("./pages/PledgeDetail"));
const ChurchProfileSettings = lazy(() => import("./pages/ChurchProfileSettings"));
const Attendance = lazy(() => import("./pages/Attendance"));
const AttendanceDetail = lazy(() => import("./pages/AttendanceDetail"));
const AttendanceScanner = lazy(() => import("./pages/AttendanceScanner"));
const EventAttendance = lazy(() => import("./pages/EventAttendance"));
const Communication = lazy(() => import("./pages/Communication"));
const Resources = lazy(() => import("./pages/Resources"));
const Churches = lazy(() => import("./pages/Churches"));
const Performance = lazy(() => import("./pages/Performance"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const UsersManagement = lazy(() => import("./pages/UsersManagement"));
const Children = lazy(() => import("./pages/Children"));
const RolesManagement = lazy(() => import("./pages/RolesManagement"));
const Teams = lazy(() => import("./pages/Teams"));
const Cells = lazy(() => import("./pages/Cells"));
const CellDetail = lazy(() => import("./pages/CellDetail"));
const CellAttendancePage = lazy(() => import("./pages/CellAttendancePage"));
const TeamMembers = lazy(() => import("./pages/TeamMembers"));
const Packages = lazy(() => import("./pages/Packages"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Withdrawals = lazy(() => import("./pages/Withdrawals"));
const RequestWithdrawal = lazy(() => import("./pages/RequestWithdrawal"));
const EventTickets = lazy(() => import("./pages/EventTickets"));
const PublicEvent = lazy(() => import("./pages/PublicEvent"));
const PublicCampaign = lazy(() => import("./pages/PublicCampaign"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));
const MyTickets = lazy(() => import("./pages/MyTickets"));
const Subaccount = lazy(() => import("./pages/Subaccount"));
const PublicAttendanceEntry = lazy(() => import("./pages/PublicAttendanceEntry"));
const PublicAttendanceScanner = lazy(() => import("./pages/PublicAttendanceScanner"));
const PublicQrCheckInPage = lazy(() => import("./pages/PublicQrCheckInPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminChurchDetail = lazy(() => import("./pages/admin/AdminChurchDetail"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const AdminPackages = lazy(() => import("./pages/admin/AdminPackages"));
const AdminPendingTransactions = lazy(() => import("./pages/admin/AdminPendingTransactions"));

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', fontFamily: 'sans-serif', color: '#888',
    }}>
      Loading…
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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

              {/* Public attendance link (no auth) */}
              <Route path="/attendance/enter/:token" element={<PublicAttendanceEntry />} />
              <Route path="/attendance/scan/:token" element={<PublicAttendanceScanner />} />
              <Route path="/check-in/:token" element={<PublicQrCheckInPage />} />

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
                <Route path="pledges" element={<Pledges />} />
                <Route path="pledges/:id" element={<PledgeDetail />} />
                <Route path="church-profile" element={<ChurchProfileSettings />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="attendance/:id" element={<AttendanceDetail />} />
                <Route path="attendance/:id/scan" element={<AttendanceScanner />} />
                <Route path="event-attendance" element={<EventAttendance />} />
                <Route path="communication" element={<Communication />} />
                <Route path="resources" element={<Resources />} />
                <Route path="churches" element={<Churches />} />
                <Route path="subaccount/:churchId" element={<Subaccount />} />
                <Route path="performance" element={<Performance />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="children" element={<Children />} />
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
                <Route path="withdrawals" element={<AdminWithdrawals />} />
                <Route path="packages" element={<AdminPackages />} />
                <Route path="payment-metadata" element={<AdminPendingTransactions />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
