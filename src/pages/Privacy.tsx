import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "who-we-are", label: "Who We Are" },
  { id: "data-we-collect", label: "Data We Collect" },
  { id: "why-we-collect", label: "Why We Collect Data" },
  { id: "data-storage", label: "How We Store Data" },
  { id: "third-party", label: "Third-Party Services" },
  { id: "data-sharing", label: "Data Sharing" },
  { id: "your-rights", label: "Your Rights" },
  { id: "cookies", label: "Cookies Policy" },
  { id: "children", label: "Children's Policy" },
  { id: "data-retention", label: "Data Retention" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "governing-law", label: "Governing Law" },
  { id: "contact", label: "Contact Us" },
];

const Privacy = () => {
  usePageMeta({
    title: "Privacy Policy — SkillMitra",
    description: "Read SkillMitra's privacy policy by Learnvate Solutions Private Limited. Learn how we collect, use, and protect your data under Indian law.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Privacy Policy",
      url: "https://skillmitra.online/privacy",
      isPartOf: { "@type": "WebSite", name: "SkillMitra", url: "https://skillmitra.online" },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 lg:px-8 max-w-3xl print:pt-8 print:max-w-none">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Privacy Policy</h1>
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
          <section id="who-we-are">
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Who We Are</h2>
            <p>SkillMitra is a product of <strong className="text-foreground">Learnvate Solutions Private Limited</strong>, a company registered in India. We operate the platform at <a href="https://skillmitra.online" className="text-primary hover:underline">skillmitra.online</a>, providing personal 1:1 skill training services connecting students and working professionals with verified industry expert trainers.</p>
            <p className="mt-2">This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform. By using SkillMitra, you consent to the practices described in this policy.</p>
          </section>

          <section id="data-we-collect">
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Data We Collect</h2>
            <p className="mb-3">We collect the following categories of personal information:</p>

            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground text-sm mb-2">Personal Identification Data</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Full name, email address, phone number</li>
                  <li>City, state, gender</li>
                  <li>Profile photograph (if uploaded)</li>
                  <li>Language preferences</li>
                </ul>
              </div>

              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground text-sm mb-2">Professional Data (Trainers Only)</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Current role, company, skills, years of experience</li>
                  <li>LinkedIn URL, bio, introduction video</li>
                  <li>Uploaded documents: ID proof, resume, certifications</li>
                  <li>PAN number (for tax and payout purposes)</li>
                  <li>Bank account details and UPI ID (for payouts)</li>
                </ul>
              </div>

              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground text-sm mb-2">Student Data</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>College name, course of study, graduation year</li>
                  <li>Skills being learned, trainer gender preference</li>
                </ul>
              </div>

              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground text-sm mb-2">Payment Information</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Transaction IDs, payment amounts, payment method</li>
                  <li>Razorpay order and payment references</li>
                  <li>We do <strong className="text-foreground">not</strong> store credit/debit card numbers — this is handled entirely by Razorpay</li>
                </ul>
              </div>

              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground text-sm mb-2">Session & Usage Data</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Session schedules, attendance records, course progress</li>
                  <li>Ratings, reviews, and feedback submitted</li>
                  <li>Search queries, platform interaction logs</li>
                  <li>Contact form submissions and dispute descriptions</li>
                </ul>
              </div>

              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground text-sm mb-2">Device & Technical Data</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Browser type, IP address, device type, operating system</li>
                  <li>Cookies and local storage data for session management</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="why-we-collect">
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Why We Collect Data</h2>
            <p className="mb-3">We collect and process your data for the following purposes:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground border-b border-border">Purpose</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground border-b border-border">Data Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr><td className="px-4 py-2.5">Account creation & authentication</td><td className="px-4 py-2.5">Name, email, phone, password</td></tr>
                  <tr><td className="px-4 py-2.5">Payment processing & refunds</td><td className="px-4 py-2.5">Payment info, transaction IDs</td></tr>
                  <tr><td className="px-4 py-2.5">Session scheduling & reminders</td><td className="px-4 py-2.5">Email, phone, session data</td></tr>
                  <tr><td className="px-4 py-2.5">Certificate generation & verification</td><td className="px-4 py-2.5">Name, course data, scores</td></tr>
                  <tr><td className="px-4 py-2.5">Trainer verification & approval</td><td className="px-4 py-2.5">ID documents, professional details</td></tr>
                  <tr><td className="px-4 py-2.5">Trainer payouts</td><td className="px-4 py-2.5">Bank details, UPI, PAN</td></tr>
                  <tr><td className="px-4 py-2.5">Student-trainer matching</td><td className="px-4 py-2.5">Skills, language, location preferences</td></tr>
                  <tr><td className="px-4 py-2.5">Platform improvement & analytics</td><td className="px-4 py-2.5">Usage data, search logs, feedback</td></tr>
                  <tr><td className="px-4 py-2.5">Fraud prevention & security</td><td className="px-4 py-2.5">IP address, device info, login activity</td></tr>
                  <tr><td className="px-4 py-2.5">Legal compliance</td><td className="px-4 py-2.5">As required by applicable Indian law</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="data-storage">
            <h2 className="text-xl font-semibold text-foreground mb-3">4. How We Store Data</h2>
            <p>Your data is stored on <strong className="text-foreground">secure cloud servers powered by Supabase</strong>, which provides enterprise-grade infrastructure with the following protections:</p>
            <ul className="list-disc pl-6 space-y-1.5 mt-3">
              <li><strong className="text-foreground">Encryption at rest and in transit</strong> — all data is encrypted using industry-standard TLS/SSL protocols</li>
              <li><strong className="text-foreground">Row-Level Security (RLS)</strong> — database-level access control ensures users can only access their own data</li>
              <li><strong className="text-foreground">Role-based access control</strong> — separate permissions for students, trainers, and administrators</li>
              <li><strong className="text-foreground">Secure file storage</strong> — documents, profile pictures, and certificates are stored in access-controlled storage buckets</li>
              <li><strong className="text-foreground">Authentication security</strong> — passwords are hashed using bcrypt; sessions use secure JWT tokens with automatic refresh</li>
            </ul>
            <p className="mt-3">We take reasonable technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section id="third-party">
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services to operate SkillMitra. Each service has its own privacy policy:</p>
            <div className="space-y-3">
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground text-sm">Razorpay — Payment Processing</h3>
                <p className="text-sm mt-1">Razorpay handles all payment transactions securely. We do not store your card numbers. Razorpay is PCI-DSS compliant. <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Razorpay Privacy Policy →</a></p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground text-sm">Resend — Transactional Emails</h3>
                <p className="text-sm mt-1">Resend delivers transactional emails including verification emails, session reminders, and notifications. Your email address is shared with Resend solely for email delivery. <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Resend Privacy Policy →</a></p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground text-sm">Supabase — Database & Infrastructure</h3>
                <p className="text-sm mt-1">Supabase provides our database, authentication, and file storage infrastructure. All data is hosted on secure cloud servers. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase Privacy Policy →</a></p>
              </div>
            </div>
          </section>

          <section id="data-sharing">
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Sharing</h2>
            <div className="bg-primary/[0.04] border border-primary/20 rounded-xl p-5">
              <p className="font-semibold text-foreground text-base mb-2">We never sell your personal data.</p>
              <p className="text-sm">SkillMitra does not sell, rent, or trade your personal information to any third parties for marketing, advertising, or any other commercial purposes.</p>
            </div>
            <p className="mt-4">We may share limited data only in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li><strong className="text-foreground">With trainers/students:</strong> Limited profile information is shared between matched trainers and students to facilitate sessions (name, skills, session details).</li>
              <li><strong className="text-foreground">With payment processors:</strong> Transaction data is shared with Razorpay solely for processing payments.</li>
              <li><strong className="text-foreground">For legal compliance:</strong> We may disclose data if required by Indian law, court order, or government authority.</li>
              <li><strong className="text-foreground">For safety:</strong> We may share data to protect the rights, safety, or property of our users, SkillMitra, or the public.</li>
            </ul>
          </section>

          <section id="your-rights">
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
            <p className="mb-3">As a SkillMitra user, you have the following rights regarding your personal data:</p>
            <div className="space-y-3">
              {[
                { title: "Right to Access", desc: "You can view and download your personal data from your profile settings at any time." },
                { title: "Right to Correction", desc: "You can update and correct your profile information directly through the platform." },
                { title: "Right to Deletion", desc: "You may request complete deletion of your account and all associated personal data by contacting us at contact@skillmitra.online. We will process deletion requests within 30 days." },
                { title: "Right to Data Portability", desc: "You can request a copy of your personal data in a standard, machine-readable format." },
                { title: "Right to Object", desc: "You can opt out of non-essential communications through your notification preferences page." },
                { title: "Right to Withdraw Consent", desc: "You may withdraw consent for data processing at any time. Note that withdrawal of consent may affect your ability to use certain platform features." },
              ].map(r => (
                <div key={r.title} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">✓</span>
                  </span>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{r.title}</p>
                    <p className="text-sm">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm">To exercise any of these rights, contact us at <a href="mailto:contact@skillmitra.online" className="text-primary hover:underline">contact@skillmitra.online</a>. We will respond within 30 days.</p>
          </section>

          <section id="cookies">
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Cookies Policy</h2>
            <p>SkillMitra uses cookies and similar technologies for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-1.5 mt-3">
              <li><strong className="text-foreground">Essential cookies:</strong> Required for user authentication, session management, and security. These cannot be disabled.</li>
              <li><strong className="text-foreground">Preference cookies:</strong> Store your language preferences, theme settings, and notification preferences using localStorage.</li>
              <li><strong className="text-foreground">Analytics cookies:</strong> Help us understand how users interact with our platform to improve the experience.</li>
            </ul>
            <p className="mt-3">You can manage cookie preferences through the cookie consent banner displayed on your first visit. You may also configure your browser to reject cookies, though this may limit certain platform functionality.</p>
          </section>

          <section id="children">
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Children's Policy</h2>
            <div className="bg-card rounded-xl border border-border p-5">
              <p>SkillMitra is designed for users aged <strong className="text-foreground">16 years and above</strong>. We do not knowingly collect personal information from children under 16.</p>
              <p className="mt-2">For users between 16–18 years of age, we strongly recommend parental supervision. SkillMitra provides <strong className="text-foreground">parent account features</strong> that allow guardians to monitor their child's enrolled courses, session attendance, and learning progress.</p>
              <p className="mt-2">If we discover that we have collected data from a child under 16, we will take immediate steps to delete the account and all associated data. If you believe a child under 16 has registered on SkillMitra, please contact us immediately at <a href="mailto:contact@skillmitra.online" className="text-primary hover:underline">contact@skillmitra.online</a>.</p>
            </div>
          </section>

          <section id="data-retention">
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active or as needed to provide our services. After account deletion:</p>
            <ul className="list-disc pl-6 space-y-1.5 mt-3">
              <li>Most personal data is deleted within <strong className="text-foreground">30 days</strong>.</li>
              <li>Transaction records may be retained for up to <strong className="text-foreground">7 years</strong> as required by Indian tax laws.</li>
              <li>Certificates and their verification data are retained <strong className="text-foreground">indefinitely</strong> to allow employers and institutions to verify their authenticity.</li>
              <li>Anonymized analytics data may be retained for platform improvement purposes.</li>
            </ul>
          </section>

          <section id="changes">
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices, services, or applicable law. We will notify you of material changes via email or an in-platform notification at least <strong className="text-foreground">15 days</strong> before the changes take effect.</p>
            <p className="mt-2">Continued use of SkillMitra after changes constitutes acceptance of the updated policy. We encourage you to review this policy periodically.</p>
          </section>

          <section id="governing-law">
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Governing Law</h2>
            <p>This Privacy Policy is governed by and construed in accordance with the <strong className="text-foreground">laws of India</strong>, including the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.</p>
            <p className="mt-2">Any disputes arising from this policy shall be subject to the exclusive jurisdiction of the courts in <strong className="text-foreground">Hyderabad, Telangana, India</strong>.</p>
          </section>

          <section id="contact">
            <h2 className="text-xl font-semibold text-foreground mb-3">13. Contact Us</h2>
            <p>For privacy concerns, data requests, or questions about this policy, please contact us:</p>
            <div className="mt-4 bg-card rounded-xl border border-border p-5">
              <p className="font-semibold text-foreground text-lg">Learnvate Solutions Private Limited</p>
              <div className="mt-3 space-y-1.5 text-sm">
                <p>Email: <a href="mailto:contact@skillmitra.online" className="text-primary hover:underline font-medium">contact@skillmitra.online</a></p>
                <p>Website: <a href="https://skillmitra.online" className="text-primary hover:underline">skillmitra.online</a></p>
                <p>Support Hours: Monday–Saturday, 9:00 AM–6:00 PM IST</p>
              </div>
            </div>
          </section>

          {/* Cross-link */}
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
            <p className="text-sm">Also read our <Link to="/terms" className="text-primary hover:underline font-medium">Terms of Service →</Link></p>
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

export default Privacy;
