import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "about", label: "About SkillMitra" },
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "user-accounts", label: "User Accounts" },
  { id: "student-obligations", label: "Student Obligations" },
  { id: "trainer-obligations", label: "Trainer Obligations" },
  { id: "prohibited-conduct", label: "Prohibited Conduct" },
  { id: "payment-terms", label: "Payment Terms" },
  { id: "refund-policy", label: "Refund Policy" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "limitation-liability", label: "Limitation of Liability" },
  { id: "termination", label: "Termination" },
  { id: "dispute-resolution", label: "Dispute Resolution" },
  { id: "changes", label: "Changes to Terms" },
  { id: "contact", label: "Contact" },
];

const Terms = () => {
  usePageMeta({
    title: "Terms of Service — SkillMitra",
    description: "SkillMitra terms of service covering platform rules, payment terms, refund policy, and user obligations by Learnvate Solutions Private Limited.",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 lg:px-8 max-w-3xl print:pt-8 print:max-w-none">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Terms of Service</h1>
            <p className="text-muted-foreground mt-2">Effective Date: March 1, 2026 · Last Updated: March 2026</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex print:hidden gap-2 flex-shrink-0"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>

        {/* Table of Contents */}
        <nav className="mt-8 bg-card rounded-xl border border-border p-5 print:border print:border-gray-300">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Table of Contents</h2>
          <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-primary hover:underline">
                  {i + 1}. {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Content */}
        <div className="mt-10 space-y-10 text-muted-foreground leading-relaxed">
          <section id="about">
            <h2 className="text-xl font-semibold text-foreground mb-3">1. About SkillMitra</h2>
            <p><strong className="text-foreground">SkillMitra</strong> is a personal 1:1 skill training platform operated by <strong className="text-foreground">Learnvate Solutions Private Limited</strong>, a company registered in India. The platform connects students and working professionals with verified expert trainers for personalized, one-on-one learning through live online sessions.</p>
            <p className="mt-2">These Terms of Service ("Terms") govern your use of the SkillMitra platform, including our website at <a href="https://skillmitra.online" className="text-primary hover:underline">skillmitra.online</a>, mobile applications, and all related services.</p>
          </section>

          <section id="acceptance">
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Acceptance of Terms</h2>
            <div className="bg-primary/[0.04] border border-primary/20 rounded-xl p-5">
              <p className="font-semibold text-foreground mb-2">By using SkillMitra, you agree to these Terms.</p>
              <p className="text-sm">By creating an account, accessing, or using any part of the SkillMitra platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
            </div>
            <ul className="list-disc pl-6 space-y-1.5 mt-4">
              <li>If you do not agree to these Terms, you must not use the platform.</li>
              <li>If you are using SkillMitra on behalf of an organization, you represent that you have authority to bind that organization to these Terms.</li>
              <li>Users must be at least <strong className="text-foreground">16 years old</strong>. Users aged 16–18 should have parental or guardian consent.</li>
            </ul>
          </section>

          <section id="user-accounts">
            <h2 className="text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>All users must provide <strong className="text-foreground">accurate, truthful, and complete information</strong> during registration.</li>
              <li>Each person may maintain only <strong className="text-foreground">one account per role</strong> (student or trainer). Creating multiple accounts is prohibited.</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials. You must not share your password with anyone.</li>
              <li>You must immediately notify us at <a href="mailto:contact@skillmitra.online" className="text-primary hover:underline">contact@skillmitra.online</a> if you suspect unauthorized use of your account.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>SkillMitra reserves the right to suspend accounts with false or misleading information.</li>
            </ul>
          </section>

          <section id="student-obligations">
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Student Obligations</h2>
            <p className="mb-3">As a student on SkillMitra, you agree to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong className="text-foreground">Attend scheduled sessions</strong> on time and notify trainers at least 2 hours in advance if you need to reschedule or cancel.</li>
              <li><strong className="text-foreground">Be respectful</strong> and maintain professional conduct during all interactions with trainers.</li>
              <li><strong className="text-foreground">Not record sessions</strong> (audio or video) without explicit permission from the trainer.</li>
              <li><strong className="text-foreground">Not share course materials</strong> (notes, recordings, resources) provided by trainers without their consent.</li>
              <li><strong className="text-foreground">Make all payments through the platform</strong> only. Off-platform payments to trainers are prohibited.</li>
              <li>Provide honest and constructive feedback through ratings and reviews.</li>
              <li>Report any issues, concerns, or policy violations through the platform's dispute system.</li>
            </ul>
          </section>

          <section id="trainer-obligations">
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Trainer Obligations</h2>
            <p className="mb-3">As a trainer on SkillMitra, you agree to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong className="text-foreground">Deliver sessions as promised</strong> — complete the scheduled number of sessions with the quality and content described in your course listing.</li>
              <li><strong className="text-foreground">Maintain teaching quality</strong> — provide well-prepared, structured sessions with real-world examples and practical exercises.</li>
              <li><strong className="text-foreground">Honor session schedules</strong> — join sessions on time. Repeated no-shows will result in account suspension.</li>
              <li><strong className="text-foreground">Provide accurate credentials</strong> — all qualifications, experience, and skills listed on your profile must be truthful and verifiable.</li>
              <li><strong className="text-foreground">Complete the verification process</strong> — submit required documents (ID proof, professional credentials) and undergo the approval process.</li>
              <li><strong className="text-foreground">Accept payments through platform only</strong> — you must not solicit students for direct payments, off-platform communication, or private arrangements.</li>
              <li><strong className="text-foreground">Respond to trial requests</strong> within 24 hours and maintain your availability calendar.</li>
              <li>Agree to the platform's commission structure as described in <a href="#payment-terms" className="text-primary hover:underline">Section 7</a>.</li>
            </ul>
          </section>

          <section id="prohibited-conduct">
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Prohibited Conduct</h2>
            <p className="mb-3">The following actions are strictly prohibited on SkillMitra and may result in immediate account termination:</p>
            <div className="bg-card rounded-xl border border-border p-5">
              <ul className="space-y-2">
                {[
                  "Harassment, abuse, threats, or discrimination towards any user",
                  "Creating fake profiles, fake reviews, or impersonating another person",
                  "Sharing inappropriate, offensive, sexually explicit, or illegal content",
                  "Spamming users with unsolicited messages or promotional content",
                  "Attempting to bypass the platform's payment system or solicit off-platform payments",
                  "Scraping, automated access, or unauthorized use of platform data",
                  "Sharing session recordings without consent of all participants",
                  "Using the platform for any purpose unrelated to legitimate skill training",
                  "Attempting to gain unauthorized access to other users' accounts or data",
                  "Any activity that violates applicable Indian law",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-destructive">✕</span>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section id="payment-terms">
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong className="text-foreground">All payments must be processed through the SkillMitra platform only</strong>, using Razorpay as our secure payment gateway.</li>
              <li>SkillMitra charges a <strong className="text-foreground">10% platform fee</strong> on all course fees. Trainers receive 90% of the course fee as their payout.</li>
              <li>Course fees are set by individual trainers and displayed on their course pages. All prices are in <strong className="text-foreground">Indian Rupees (INR)</strong>.</li>
              <li>Trainer payouts are processed to the bank account or UPI ID registered on their profile, subject to a minimum payout threshold of <strong className="text-foreground">₹500</strong>.</li>
              <li>Referral rewards are credited to the user's wallet upon successful referral completion.</li>
              <li>SkillMitra does not store credit/debit card information. All payment data is handled securely by Razorpay (PCI-DSS compliant).</li>
              <li>Off-platform payments between students and trainers are strictly prohibited and may result in account termination for both parties.</li>
            </ul>
          </section>

          <section id="refund-policy">
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Refund Policy</h2>
            <p className="mb-4">SkillMitra offers a transparent refund policy to protect students:</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-card rounded-lg border border-border p-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 text-sm font-bold flex-shrink-0">100%</span>
                <div>
                  <p className="font-semibold text-foreground">Full Refund — Within 48 hours of first session</p>
                  <p className="text-sm mt-1">If you request a refund within 48 hours of your first session, you will receive a <strong className="text-foreground">100% refund</strong> of the course fee. Zero questions asked.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-card rounded-lg border border-border p-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-700 text-sm font-bold flex-shrink-0">50%</span>
                <div>
                  <p className="font-semibold text-foreground">50% Refund — Within 7 days of enrollment</p>
                  <p className="text-sm mt-1">If you request a refund between 48 hours and 7 days after enrollment, you will receive a <strong className="text-foreground">50% refund</strong> of the course fee.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-card rounded-lg border border-border p-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700 text-sm font-bold flex-shrink-0">0%</span>
                <div>
                  <p className="font-semibold text-foreground">No Refund — After 7 days</p>
                  <p className="text-sm mt-1">No refunds will be issued after 7 days from the enrollment date. We strongly encourage using the free trial session to evaluate trainers before enrolling.</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm">To request a refund, contact us at <a href="mailto:contact@skillmitra.online" className="text-primary hover:underline">contact@skillmitra.online</a> or raise a dispute through the platform. Refunds are processed within <strong className="text-foreground">5–7 business days</strong> to the original payment method.</p>
          </section>

          <section id="intellectual-property">
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>All platform content — including the SkillMitra name, logo, website design, features, text, and graphics — is the <strong className="text-foreground">intellectual property of Learnvate Solutions Private Limited</strong> and is protected under Indian copyright and trademark laws.</li>
              <li>Course content, materials, and resources created by trainers remain their intellectual property but are licensed to SkillMitra for use on the platform during the trainer's active membership.</li>
              <li>Students may not copy, redistribute, resell, or publicly share course materials, session recordings, or trainer-provided resources without explicit written permission.</li>
              <li>User-generated content (reviews, ratings, feedback) may be used by SkillMitra for platform improvement and marketing purposes.</li>
              <li>You may not use SkillMitra's name, logo, or branding without prior written authorization.</li>
            </ul>
          </section>

          <section id="limitation-liability">
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
            <div className="bg-card rounded-xl border border-border p-5 space-y-3">
              <p>SkillMitra acts as a <strong className="text-foreground">marketplace and intermediary</strong> connecting trainers and students. The following limitations apply:</p>
              <ul className="list-disc pl-6 space-y-1.5 text-sm">
                <li>SkillMitra does not guarantee specific learning outcomes, employment, job placement, or career advancement.</li>
                <li>The quality and content of individual training sessions are the responsibility of the respective trainer.</li>
                <li>SkillMitra is <strong className="text-foreground">not liable for the quality of training</strong> beyond the refund policy described in <a href="#refund-policy" className="text-primary hover:underline">Section 8</a>.</li>
                <li>Our total liability to any user shall not exceed the amount paid by that user for the specific service in question.</li>
                <li>SkillMitra is not responsible for technical issues arising from third-party services (video conferencing, internet connectivity, etc.).</li>
                <li>The platform is provided "as is" without warranties of any kind, either express or implied.</li>
              </ul>
            </div>
          </section>

          <section id="termination">
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Termination</h2>
            <p className="mb-3">SkillMitra reserves the right to suspend or terminate user accounts under the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Violation of any provision of these Terms of Service.</li>
              <li>Providing false or misleading information during registration or verification.</li>
              <li>Engaging in any <a href="#prohibited-conduct" className="text-primary hover:underline">prohibited conduct</a> as described in Section 6.</li>
              <li>Repeated no-shows, poor conduct, or failure to maintain quality standards (for trainers).</li>
              <li>Payment fraud, chargebacks, or abuse of the refund system.</li>
              <li>At the platform's discretion for any reason that threatens platform integrity or user safety.</li>
            </ul>
            <p className="mt-3"><strong className="text-foreground">Upon termination:</strong></p>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li>Active enrollments may be refunded on a pro-rata basis at SkillMitra's discretion.</li>
              <li>Earned certificates remain valid and verifiable even after account termination.</li>
              <li>Users may deactivate their own account at any time by contacting support.</li>
            </ul>
          </section>

          <section id="dispute-resolution">
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Dispute Resolution</h2>
            <p className="mb-3">SkillMitra provides a structured dispute resolution process:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong className="text-foreground">Internal Resolution:</strong> Users can raise disputes through the platform's built-in dispute system. Our team will review and work towards a fair resolution within <strong className="text-foreground">7 business days</strong>.</li>
              <li><strong className="text-foreground">Escalation:</strong> If an internal resolution is not satisfactory, the matter may be escalated to mediation.</li>
              <li><strong className="text-foreground">Arbitration:</strong> If mediation fails, disputes shall be resolved through arbitration in accordance with the Arbitration and Conciliation Act, 1996.</li>
            </ol>
            <div className="bg-card rounded-xl border border-border p-5 mt-4">
              <p className="font-semibold text-foreground text-sm">Governing Law & Jurisdiction</p>
              <p className="text-sm mt-1">These Terms are governed by the <strong className="text-foreground">laws of India</strong>. Any legal proceedings arising from these Terms shall be subject to the exclusive jurisdiction of the courts in <strong className="text-foreground">Hyderabad, Telangana, India</strong>.</p>
            </div>
          </section>

          <section id="changes">
            <h2 className="text-xl font-semibold text-foreground mb-3">13. Changes to Terms</h2>
            <p>We may update these Terms of Service from time to time. Material changes will be communicated via email or in-platform notification at least <strong className="text-foreground">30 days</strong> before taking effect.</p>
            <p className="mt-2">Continued use of SkillMitra after changes constitutes acceptance of the updated Terms. If you do not agree with the changes, you should discontinue use of the platform.</p>
            <p className="mt-2">We encourage you to review these Terms periodically for any updates.</p>
          </section>

          <section id="contact">
            <h2 className="text-xl font-semibold text-foreground mb-3">14. Contact</h2>
            <p>For questions, concerns, or complaints about these Terms of Service, please contact us:</p>
            <div className="mt-4 bg-card rounded-xl border border-border p-5">
              <p className="font-semibold text-foreground text-lg">Learnvate Solutions Private Limited</p>
              <p className="text-sm text-muted-foreground mt-0.5">Operating as SkillMitra</p>
              <div className="mt-3 space-y-1.5 text-sm">
                <p>Email: <a href="mailto:contact@skillmitra.online" className="text-primary hover:underline font-medium">contact@skillmitra.online</a></p>
                <p>Website: <a href="https://skillmitra.online" className="text-primary hover:underline">skillmitra.online</a></p>
                <p>Support Hours: Monday–Saturday, 9:00 AM–6:00 PM IST</p>
              </div>
            </div>
          </section>

          {/* Cross-link */}
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
            <p className="text-sm">Also read our <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy →</Link></p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 md:hidden"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" /> Print this page
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
