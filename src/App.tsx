import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import CookieConsent from "@/components/CookieConsent";
import ScrollToTop from "@/components/ScrollToTop";
import AIChatBot from "@/components/AIChatBot";

// Public pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BrowseTrainers from "./pages/BrowseTrainers";
import Contact from "./pages/Contact";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Standards from "./pages/Standards";
import CertificateVerify from "./pages/CertificateVerify";
import JoinRedirect from "./pages/JoinRedirect";
import Notifications from "./pages/Notifications";
import NotificationPreferences from "./pages/NotificationPreferences";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Student
import StudentLogin from "./pages/student/Login";
import StudentSignup from "./pages/student/Signup";
import StudentDashboard from "./pages/student/Dashboard";
import StudentCourses from "./pages/student/Courses";
import StudentReferrals from "./pages/student/Referrals";
import AIInterview from "./pages/student/AIInterview";
import ResumeBuilder from "./pages/student/ResumeBuilder";
import StudentCertificates from "./pages/student/StudentCertificates";
import StudentProfile from "./pages/student/StudentProfile";
import StudentWallet from "./pages/student/Wallet";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentSessions from "./pages/student/Sessions";

// Trainer
import TrainerLogin from "./pages/trainer/Login";
import TrainerSignup from "./pages/trainer/Signup";
import TrainerThankYou from "./pages/trainer/ThankYou";
import TrainerDashboard from "./pages/trainer/Dashboard";
import TrainerProfile from "./pages/trainer/Profile";
import TrainerSubscription from "./pages/trainer/Subscription";
import TrainerCourses from "./pages/trainer/Courses";
import TrainerStudents from "./pages/trainer/Students";
import TrainerEarnings from "./pages/trainer/Earnings";
import TrainerCertificates from "./pages/trainer/Certificates";
import TrainerSchedule from "./pages/trainer/Schedule";
import TrainerWallet from "./pages/trainer/Wallet";
import TrainerReferrals from "./pages/trainer/Referrals";
import TrainerAttendance from "./pages/trainer/Attendance";
import TrainerSessions from "./pages/trainer/Sessions";
import TrainerReviews from "./pages/trainer/Reviews";

// Admin
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminTrainers from "./pages/admin/Trainers";
import AdminStudents from "./pages/admin/Students";
import AdminPayments from "./pages/admin/Payments";
import AdminPayouts from "./pages/admin/Payouts";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminDisputes from "./pages/admin/Disputes";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminMessages from "./pages/admin/Messages";
import AdminRatings from "./pages/admin/Ratings";
import AdminReferrals from "./pages/admin/AdminReferrals";
import AdminWallets from "./pages/admin/AdminWallets";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminSettings from "./pages/admin/Settings";
import AdminCommunications from "./pages/admin/Communications";

// Parent
import ParentLogin from "./pages/parent/Login";
import ParentDashboard from "./pages/parent/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <PWAInstallPrompt />
          <CookieConsent />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<BrowseTrainers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/standards" element={<Standards />} />
            <Route path="/verify/:certificateId" element={<CertificateVerify />} />
            <Route path="/verify" element={<CertificateVerify />} />
            <Route path="/trainer/:id" element={<TrainerProfile />} />
            <Route path="/join/:code" element={<JoinRedirect />} />

            {/* Auth pages */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/signup" element={<StudentSignup />} />
            <Route path="/trainer/login" element={<TrainerLogin />} />
            <Route path="/trainer/signup" element={<TrainerSignup />} />
            <Route path="/trainer/signup/thankyou" element={<TrainerThankYou />} />
            <Route path="/trainer/signup/success" element={<TrainerThankYou />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/parent/login" element={<ParentLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Student Protected */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/courses" element={<ProtectedRoute allowedRoles={["student"]}><StudentCourses /></ProtectedRoute>} />
            <Route path="/student/sessions" element={<ProtectedRoute allowedRoles={["student"]}><StudentSessions /></ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={["student"]}><StudentAttendance /></ProtectedRoute>} />
            <Route path="/student/referrals" element={<ProtectedRoute allowedRoles={["student"]}><StudentReferrals /></ProtectedRoute>} />
            <Route path="/student/interview" element={<ProtectedRoute allowedRoles={["student"]}><AIInterview /></ProtectedRoute>} />
            <Route path="/student/resume" element={<ProtectedRoute allowedRoles={["student"]}><ResumeBuilder /></ProtectedRoute>} />
            <Route path="/student/certificates" element={<ProtectedRoute allowedRoles={["student"]}><StudentCertificates /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute allowedRoles={["student"]}><StudentProfile /></ProtectedRoute>} />
            <Route path="/student/wallet" element={<ProtectedRoute allowedRoles={["student"]}><StudentWallet /></ProtectedRoute>} />
            <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={["student"]}><Notifications /></ProtectedRoute>} />
            <Route path="/notification-preferences" element={<ProtectedRoute allowedRoles={["student", "trainer"]}><NotificationPreferences /></ProtectedRoute>} />

            {/* Trainer Protected */}
            <Route path="/trainer/dashboard" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerDashboard /></ProtectedRoute>} />
            <Route path="/trainer/courses" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerCourses /></ProtectedRoute>} />
            <Route path="/trainer/students" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerStudents /></ProtectedRoute>} />
            <Route path="/trainer/earnings" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerEarnings /></ProtectedRoute>} />
            <Route path="/trainer/certificates" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerCertificates /></ProtectedRoute>} />
            <Route path="/trainer/subscription" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerSubscription /></ProtectedRoute>} />
            <Route path="/trainer/schedule" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerSchedule /></ProtectedRoute>} />
            <Route path="/trainer/profile" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerProfile /></ProtectedRoute>} />
            <Route path="/trainer/wallet" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerWallet /></ProtectedRoute>} />
            <Route path="/trainer/referrals" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerReferrals /></ProtectedRoute>} />
            <Route path="/trainer/attendance" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerAttendance /></ProtectedRoute>} />
            <Route path="/trainer/sessions" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerSessions /></ProtectedRoute>} />
            <Route path="/trainer/reviews" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerReviews /></ProtectedRoute>} />
            <Route path="/trainer/notifications" element={<ProtectedRoute allowedRoles={["trainer"]}><Notifications /></ProtectedRoute>} />

            {/* Admin Protected */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/trainers" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTrainers /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCourses /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPayouts /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/disputes" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDisputes /></ProtectedRoute>} />
            <Route path="/admin/certificates" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCertificates /></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={["admin"]}><AdminMessages /></ProtectedRoute>} />
            <Route path="/admin/ratings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRatings /></ProtectedRoute>} />
            <Route path="/admin/referrals" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReferrals /></ProtectedRoute>} />
            <Route path="/admin/wallets" element={<ProtectedRoute allowedRoles={["admin"]}><AdminWallets /></ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAttendance /></ProtectedRoute>} />
            <Route path="/admin/sessions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSessions /></ProtectedRoute>} />
            <Route path="/admin/subscriptions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSubscriptions /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/communications" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCommunications /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={["admin"]}><Notifications /></ProtectedRoute>} />

            {/* Parent Protected */}
            <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><ParentDashboard /></ProtectedRoute>} />

            {/* Notifications (any authenticated) */}
            <Route path="/notifications" element={<ProtectedRoute allowedRoles={["student", "trainer", "admin"]}><Notifications /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
