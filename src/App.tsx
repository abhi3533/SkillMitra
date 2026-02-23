import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BrowseTrainers from "./pages/BrowseTrainers";
import StudentLogin from "./pages/student/Login";
import StudentSignup from "./pages/student/Signup";
import StudentDashboard from "./pages/student/Dashboard";
import StudentCourses from "./pages/student/Courses";
import StudentReferrals from "./pages/student/Referrals";
import AIInterview from "./pages/student/AIInterview";
import ResumeBuilder from "./pages/student/ResumeBuilder";
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
import AdminDashboard from "./pages/admin/Dashboard";
import AdminTrainers from "./pages/admin/Trainers";
import AdminStudents from "./pages/admin/Students";
import AdminPayments from "./pages/admin/Payments";
import AdminPayouts from "./pages/admin/Payouts";
import AdminAnalytics from "./pages/admin/Analytics";
import CertificateVerify from "./pages/CertificateVerify";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<BrowseTrainers />} />
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/signup" element={<StudentSignup />} />
            <Route path="/trainer/login" element={<TrainerLogin />} />
            <Route path="/trainer/signup" element={<TrainerSignup />} />
            <Route path="/trainer/signup/thankyou" element={<TrainerThankYou />} />
            <Route path="/trainer/:id" element={<TrainerProfile />} />
            <Route path="/verify/:certificateId" element={<CertificateVerify />} />
            <Route path="/verify" element={<CertificateVerify />} />

            {/* Student Protected */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/courses" element={<ProtectedRoute allowedRoles={["student"]}><StudentCourses /></ProtectedRoute>} />
            <Route path="/student/referrals" element={<ProtectedRoute allowedRoles={["student"]}><StudentReferrals /></ProtectedRoute>} />
            <Route path="/student/interview" element={<ProtectedRoute allowedRoles={["student"]}><AIInterview /></ProtectedRoute>} />
            <Route path="/student/resume" element={<ProtectedRoute allowedRoles={["student"]}><ResumeBuilder /></ProtectedRoute>} />

            {/* Trainer Protected */}
            <Route path="/trainer/dashboard" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerDashboard /></ProtectedRoute>} />
            <Route path="/trainer/courses" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerCourses /></ProtectedRoute>} />
            <Route path="/trainer/students" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerStudents /></ProtectedRoute>} />
            <Route path="/trainer/earnings" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerEarnings /></ProtectedRoute>} />
            <Route path="/trainer/certificates" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerCertificates /></ProtectedRoute>} />
            <Route path="/trainer/subscription" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerSubscription /></ProtectedRoute>} />

            {/* Admin Protected */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/trainers" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTrainers /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPayouts /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />

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
