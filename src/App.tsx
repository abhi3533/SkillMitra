import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import CookieConsent from "@/components/CookieConsent";
import ScrollToTop from "@/components/ScrollToTop";
import AIChatBot from "@/components/AIChatBot";

import { lazy, Suspense, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";

// Critical: load eagerly
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-loaded public pages
const BrowseTrainers = lazy(() => import("./pages/BrowseTrainers"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Standards = lazy(() => import("./pages/Standards"));
const CertificateVerify = lazy(() => import("./pages/CertificateVerify"));
const ReferPage = lazy(() => import("./pages/Refer"));
const LoginRoleSelect = lazy(() => import("./pages/LoginRoleSelect"));
const JoinRedirect = lazy(() => import("./pages/JoinRedirect"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailVerified = lazy(() => import("./pages/EmailVerified"));

// Lazy-loaded Student pages
const StudentLogin = lazy(() => import("./pages/student/Login"));
const StudentSignup = lazy(() => import("./pages/student/Signup"));
const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const StudentCourses = lazy(() => import("./pages/student/Courses"));
const StudentReferrals = lazy(() => import("./pages/student/Referrals"));
const AIInterview = lazy(() => import("./pages/student/AIInterview"));
const ResumeBuilder = lazy(() => import("./pages/student/ResumeBuilder"));
const StudentCertificates = lazy(() => import("./pages/student/StudentCertificates"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const StudentWallet = lazy(() => import("./pages/student/Wallet"));
const StudentAttendance = lazy(() => import("./pages/student/StudentAttendance"));
const StudentSessions = lazy(() => import("./pages/student/Sessions"));
const StudentReceipt = lazy(() => import("./pages/student/Receipt"));

// Lazy-loaded Trainer pages
const TrainerLogin = lazy(() => import("./pages/trainer/Login"));
const TrainerSignup = lazy(() => import("./pages/trainer/Signup"));
const TrainerOnboarding = lazy(() => import("./pages/trainer/Onboarding"));
const TrainerThankYou = lazy(() => import("./pages/trainer/ThankYou"));
const TrainerDashboard = lazy(() => import("./pages/trainer/Dashboard"));
const TrainerProfile = lazy(() => import("./pages/trainer/Profile"));
const TrainerSubscription = lazy(() => import("./pages/trainer/Subscription"));
const TrainerCourses = lazy(() => import("./pages/trainer/Courses"));
const TrainerStudents = lazy(() => import("./pages/trainer/Students"));
const TrainerEarnings = lazy(() => import("./pages/trainer/Earnings"));
const TrainerCertificates = lazy(() => import("./pages/trainer/Certificates"));
const TrainerSchedule = lazy(() => import("./pages/trainer/Schedule"));
const TrainerWallet = lazy(() => import("./pages/trainer/Wallet"));
const TrainerReferrals = lazy(() => import("./pages/trainer/Referrals"));
const TrainerAttendance = lazy(() => import("./pages/trainer/Attendance"));
const TrainerSessions = lazy(() => import("./pages/trainer/Sessions"));
const TrainerReviews = lazy(() => import("./pages/trainer/Reviews"));
const TrainerMyProfile = lazy(() => import("./pages/trainer/MyProfile"));
const TrainerTrialSettings = lazy(() => import("./pages/trainer/TrialSettings"));

// Lazy-loaded Admin pages
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminTrainers = lazy(() => import("./pages/admin/Trainers"));
const AdminStudents = lazy(() => import("./pages/admin/Students"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminPayouts = lazy(() => import("./pages/admin/Payouts"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminDisputes = lazy(() => import("./pages/admin/Disputes"));
const AdminCertificates = lazy(() => import("./pages/admin/AdminCertificates"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const AdminRatings = lazy(() => import("./pages/admin/Ratings"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminWallets = lazy(() => import("./pages/admin/AdminWallets"));
const AdminAttendance = lazy(() => import("./pages/admin/AdminAttendance"));
const AdminSessions = lazy(() => import("./pages/admin/AdminSessions"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminCommunications = lazy(() => import("./pages/admin/Communications"));
const AdminTrainerInvitations = lazy(() => import("./pages/admin/TrainerInvitations"));
const AdminTrialBookings = lazy(() => import("./pages/admin/AdminTrialBookings"));

// Lazy-loaded Parent pages
const ParentLogin = lazy(() => import("./pages/parent/Login"));
const ParentDashboard = lazy(() => import("./pages/parent/Dashboard"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const useAuthRedirect = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading || !user || !role) return;
    if (hasRedirected.current) return;

    const path = location.pathname;
    const loginPages = ["/login", "/student/login", "/trainer/login", "/admin/login", "/student/signup", "/trainer/signup"];
    const isLoginPage = loginPages.includes(path);
    const isRoot = path === "/";
    // Also handle OAuth callback paths
    const isOAuthCallback = path.startsWith("/~oauth");

    // Only redirect from root (OAuth return), login pages, or OAuth callback
    if (!isRoot && !isLoginPage && !isOAuthCallback) return;

    hasRedirected.current = true;

    if (role === "student") navigate("/student/dashboard", { replace: true });
    else if (role === "trainer") navigate("/trainer/dashboard", { replace: true });
    else if (role === "admin") navigate("/admin/dashboard", { replace: true });
  }, [user, role, loading, location.pathname, navigate]);

  // Reset flag when user signs out
  useEffect(() => {
    if (!user) hasRedirected.current = false;
  }, [user]);
};

const AppContent = () => {
  useAuthRedirect();
  return (
    <>
      <PWAInstallPrompt />
      <CookieConsent />
      <Suspense fallback={<LazyFallback />}>
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
          <Route path="/course/:courseId" element={<CourseDetail />} />
          <Route path="/join/:code" element={<JoinRedirect />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/refer" element={<ReferPage />} />

          {/* Auth pages */}
          <Route path="/login" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-lg hero-gradient animate-pulse" /></div>}><LoginRoleSelect /></Suspense>} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/signup" element={<StudentSignup />} />
          <Route path="/trainer/login" element={<TrainerLogin />} />
          <Route path="/trainer/signup" element={<TrainerSignup />} />
          <Route path="/trainer/onboarding" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerOnboarding /></ProtectedRoute>} />
          <Route path="/trainer/signup/thankyou" element={<TrainerThankYou />} />
          <Route path="/trainer/signup/success" element={<TrainerThankYou />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/parent/login" element={<ParentLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-verified" element={<EmailVerified />} />

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
          <Route path="/student/receipt/:enrollmentId" element={<ProtectedRoute allowedRoles={["student"]}><StudentReceipt /></ProtectedRoute>} />
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
          <Route path="/trainer/profile" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerMyProfile /></ProtectedRoute>} />
          <Route path="/trainer/wallet" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerWallet /></ProtectedRoute>} />
          <Route path="/trainer/referrals" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerReferrals /></ProtectedRoute>} />
          <Route path="/trainer/attendance" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerAttendance /></ProtectedRoute>} />
          <Route path="/trainer/sessions" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerSessions /></ProtectedRoute>} />
          <Route path="/trainer/reviews" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerReviews /></ProtectedRoute>} />
          <Route path="/trainer/trial-settings" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerTrialSettings /></ProtectedRoute>} />
          <Route path="/trainer/notifications" element={<ProtectedRoute allowedRoles={["trainer"]}><Notifications /></ProtectedRoute>} />

          {/* Admin Protected */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
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
          <Route path="/admin/trainer-invitations" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTrainerInvitations /></ProtectedRoute>} />
          <Route path="/admin/trial-bookings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTrialBookings /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={["admin"]}><Notifications /></ProtectedRoute>} />

          {/* Parent Protected */}
          <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={["student", "trainer", "admin"]}><ParentDashboard /></ProtectedRoute>} />

          {/* Notifications (any authenticated) */}
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={["student", "trainer", "admin"]}><Notifications /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <AIChatBot />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
