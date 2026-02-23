import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BrowseTrainers from "./pages/BrowseTrainers";
import StudentLogin from "./pages/student/Login";
import StudentSignup from "./pages/student/Signup";
import StudentDashboard from "./pages/student/Dashboard";
import AIInterview from "./pages/student/AIInterview";
import ResumeBuilder from "./pages/student/ResumeBuilder";
import TrainerLogin from "./pages/trainer/Login";
import TrainerSignup from "./pages/trainer/Signup";
import TrainerThankYou from "./pages/trainer/ThankYou";
import TrainerDashboard from "./pages/trainer/Dashboard";
import TrainerProfile from "./pages/trainer/Profile";
import TrainerSubscription from "./pages/trainer/Subscription";
import AdminDashboard from "./pages/admin/Dashboard";
import CertificateVerify from "./pages/CertificateVerify";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/browse" element={<BrowseTrainers />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/signup" element={<StudentSignup />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/interview" element={<AIInterview />} />
          <Route path="/student/resume" element={<ResumeBuilder />} />
          <Route path="/trainer/login" element={<TrainerLogin />} />
          <Route path="/trainer/signup" element={<TrainerSignup />} />
          <Route path="/trainer/signup/thankyou" element={<TrainerThankYou />} />
          <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
          <Route path="/trainer/:id" element={<TrainerProfile />} />
          <Route path="/trainer/subscription" element={<TrainerSubscription />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/trainers" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<AdminDashboard />} />
          <Route path="/verify/:certificateId" element={<CertificateVerify />} />
          <Route path="/verify" element={<CertificateVerify />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
