import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const Terms = () => {
  usePageMeta({
    title: "Terms of Service — SkillMitra",
    description: "SkillMitra terms of service covering platform rules, payment terms, refund policy, and user obligations by Learnvate Solutions Private Limited.",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 lg:px-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground mt-2">Effective Date: January 1, 2026 | Last Updated: January 2026</p>

        <div className="mt-8 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. About SkillMitra</h2>
            <p>SkillMitra is a platform operated by <strong className="text-foreground">Learnvate Solutions Private Limited</strong>, a company registered in India. We provide a marketplace connecting students with verified expert trainers for personal 1:1 skill training sessions. By using SkillMitra, you agree to these Terms of Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Platform Rules</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>All users must provide accurate, truthful information during registration.</li>
              <li>Users must be at least 16 years old. Users aged 16–18 should have parental consent.</li>
              <li>Each person may maintain only one account per role (student/trainer).</li>
              <li>All sessions must be conducted through the SkillMitra platform. Off-platform arrangements are prohibited.</li>
              <li>Users must not share login credentials with others.</li>
              <li>All content shared on the platform must be original or properly licensed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Trainer Obligations</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Trainers must complete the verification process including ID proof, professional documents, and profile details before being listed on the platform.</li>
              <li>Trainers must maintain professional conduct during all sessions.</li>
              <li>Trainers must honor scheduled sessions and join on time. Repeated no-shows may result in account suspension.</li>
              <li>Trainers must provide accurate information about their qualifications, experience, and course content.</li>
              <li>Trainers are responsible for maintaining their availability calendar and responding to trial requests within 24 hours.</li>
              <li>Trainers must not solicit students for off-platform payments or communication.</li>
              <li>Trainers agree to the platform's commission structure as outlined in Pricing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Student Rights</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Students have the right to a free trial session before enrolling in any course.</li>
              <li>Students have the right to rate and review trainers after each session.</li>
              <li>Students can request a refund as per our Refund Policy (see Section 6).</li>
              <li>Students have the right to report trainers for inappropriate behavior or poor quality.</li>
              <li>Students can raise disputes through the platform's dispute resolution system.</li>
              <li>Students have access to their attendance records, progress reports, and certificates.</li>
              <li>Students can request deletion of their account and personal data at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>All payments are processed securely through Razorpay.</li>
              <li>SkillMitra charges a <strong className="text-foreground">10% platform commission</strong> on all course fees. Trainers receive 90% of the course fee.</li>
              <li>Course fees are set by individual trainers and displayed on their course pages.</li>
              <li>Trainer payouts are processed to the bank account or UPI ID registered on their profile, subject to a minimum payout threshold of ₹500.</li>
              <li>All prices are in Indian Rupees (INR) and inclusive of applicable taxes unless otherwise stated.</li>
              <li>Referral rewards are credited to the user's wallet upon successful referral completion.</li>
            </ul>
          </section>

          <section id="refund-policy">
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Refund Policy</h2>
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 text-sm font-bold flex-shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-foreground">Full Refund — Within 48 hours of enrollment</p>
                  <p className="text-sm">If you request a refund within 48 hours of your enrollment date, you will receive a <strong className="text-foreground">100% refund</strong> of the course fee, regardless of whether any sessions have been attended.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 text-sm font-bold flex-shrink-0">½</span>
                <div>
                  <p className="font-semibold text-foreground">50% Refund — Within 7 days of enrollment</p>
                  <p className="text-sm">If you request a refund between 48 hours and 7 days after enrollment, you will receive a <strong className="text-foreground">50% refund</strong> of the course fee.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 text-sm font-bold flex-shrink-0">✕</span>
                <div>
                  <p className="font-semibold text-foreground">No Refund — After 7 days</p>
                  <p className="text-sm">No refunds will be issued after 7 days from the enrollment date. We encourage students to use the free trial session to evaluate trainers before enrolling.</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm">To request a refund, please contact us at <a href="mailto:contact@skillmitra.online" className="text-primary hover:underline">contact@skillmitra.online</a> or raise a dispute through the platform. Refunds are processed within 5–7 business days to the original payment method.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Prohibited Conduct</h2>
            <p className="mb-2">The following actions are strictly prohibited on SkillMitra:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Harassment, abuse, or discrimination towards any user.</li>
              <li>Sharing inappropriate, offensive, or illegal content.</li>
              <li>Impersonating another person or providing false information.</li>
              <li>Attempting to bypass platform payment systems.</li>
              <li>Scraping, automated access, or unauthorized use of the platform's data.</li>
              <li>Creating fake reviews or ratings.</li>
              <li>Using the platform for purposes unrelated to skill training.</li>
              <li>Sharing session recordings without consent of all participants.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Intellectual Property</h2>
            <p>All content on SkillMitra — including the platform design, logo, text, and features — is the intellectual property of Learnvate Solutions Private Limited. Course content created by trainers remains their intellectual property but is licensed to SkillMitra for platform use. Students may not redistribute, resell, or share course materials without permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Termination</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Users may deactivate their account at any time by contacting support.</li>
              <li>SkillMitra reserves the right to suspend or terminate accounts that violate these Terms.</li>
              <li>Trainers may be removed from the platform for repeated no-shows, fake credentials, or prohibited conduct.</li>
              <li>Students may be suspended for abusive behavior, payment fraud, or Terms violations.</li>
              <li>Upon termination, active enrollments may be refunded on a pro-rata basis at SkillMitra's discretion.</li>
              <li>Earned certificates remain valid and verifiable even after account termination.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
            <p>SkillMitra acts as a marketplace connecting trainers and students. We do not guarantee specific learning outcomes, employment, or career advancement. The quality of training depends on the individual trainer, and we are not liable for the content or delivery of individual sessions. Our total liability is limited to the amount paid by the user for the specific service in question.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Dispute Resolution</h2>
            <p>Users can raise disputes through the platform's built-in dispute system. Our team will review disputes and work towards a fair resolution within 7 business days. If a dispute cannot be resolved internally, it will be subject to arbitration in accordance with Indian law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Governing Law</h2>
            <p>These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in India.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">13. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Material changes will be communicated via email or platform notification at least 30 days before taking effect. Continued use of SkillMitra after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">14. Contact</h2>
            <p>For questions about these Terms, please contact:</p>
            <div className="mt-3 bg-card rounded-xl border border-border p-4">
              <p className="font-semibold text-foreground">Learnvate Solutions Private Limited</p>
              <p className="mt-1">Email: <a href="mailto:contact@skillmitra.online" className="text-primary hover:underline">contact@skillmitra.online</a></p>
              <p>Website: <a href="https://skillmitra.online" className="text-primary hover:underline">skillmitra.online</a></p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
