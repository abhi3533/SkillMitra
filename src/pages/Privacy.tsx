import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const Privacy = () => {
  usePageMeta({
    title: "Privacy Policy — SkillMitra",
    description: "Read SkillMitra's privacy policy by Learnvate Solutions Private Limited. Learn how we collect, use, and protect your data.",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 lg:px-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2">Effective Date: January 1, 2026 | Last Updated: January 2026</p>

        <div className="mt-8 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Who We Are</h2>
            <p>SkillMitra is a product of <strong className="text-foreground">Learnvate Solutions Private Limited</strong>, a company registered in India. We operate the platform at skillmitra.online, providing personal 1:1 skill training services connecting students with verified industry expert trainers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <p className="mb-2">We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong className="text-foreground">Account Information:</strong> Full name, email address, phone number, city, state, gender, and language preferences provided during registration.</li>
              <li><strong className="text-foreground">Profile Data:</strong> For trainers — professional details including current role, company, skills, experience, bio, LinkedIn URL, and uploaded documents (ID proof, resume, certificates).</li>
              <li><strong className="text-foreground">Student Data:</strong> College name, course of study, graduation year, skills being learned, and trainer gender preference.</li>
              <li><strong className="text-foreground">Payment Information:</strong> Transaction details processed securely through Razorpay. We do not store credit/debit card numbers.</li>
              <li><strong className="text-foreground">Usage Data:</strong> Session activity, attendance records, course progress, search queries, and platform interaction logs.</li>
              <li><strong className="text-foreground">Communication Data:</strong> Ratings, reviews, dispute descriptions, and contact form submissions.</li>
              <li><strong className="text-foreground">Device Data:</strong> Browser type, IP address, device type, and operating system for security and analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>To create and manage your account and profile</li>
              <li>To match students with suitable trainers</li>
              <li>To process payments, refunds, and trainer payouts</li>
              <li>To send session reminders, notifications, and platform updates</li>
              <li>To issue and verify certificates</li>
              <li>To improve our platform, features, and user experience</li>
              <li>To prevent fraud, abuse, and ensure platform security</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Storage & Security</h2>
            <p>Your data is stored securely on cloud infrastructure provided by <strong className="text-foreground">Supabase</strong> (database and authentication) with encryption at rest and in transit. File uploads (documents, profile pictures, certificates) are stored in secure cloud storage buckets with appropriate access controls.</p>
            <p className="mt-2">We implement industry-standard security measures including Row-Level Security (RLS) policies, role-based access control, and encrypted connections to protect your personal information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Third-Party Services</h2>
            <p className="mb-2">We use the following third-party services to operate SkillMitra:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong className="text-foreground">Razorpay:</strong> For secure payment processing. Razorpay's privacy policy applies to payment data. We do not store your card details.</li>
              <li><strong className="text-foreground">Resend:</strong> For sending transactional emails (verification, reminders, notifications). Your email address is shared for delivery purposes only.</li>
              <li><strong className="text-foreground">Supabase:</strong> For database hosting, authentication, and file storage. Data is hosted on secure cloud infrastructure.</li>
            </ul>
            <p className="mt-2">We do not sell, rent, or trade your personal information to any third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Cookies</h2>
            <p>We use essential cookies and localStorage to maintain your session, remember your preferences, and improve your browsing experience. You can manage cookie preferences through the cookie consent banner shown on your first visit.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong className="text-foreground">Access:</strong> You can view and download your personal data from your profile at any time.</li>
              <li><strong className="text-foreground">Correction:</strong> You can update your profile information through the platform.</li>
              <li><strong className="text-foreground">Deletion:</strong> You may request deletion of your account and associated data by contacting us.</li>
              <li><strong className="text-foreground">Portability:</strong> You can request a copy of your data in a standard format.</li>
              <li><strong className="text-foreground">Objection:</strong> You can opt out of non-essential communications through notification preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active or as needed to provide our services. After account deletion, we may retain certain data for up to 90 days for legal compliance, dispute resolution, or fraud prevention. Certificates and their verification data are retained indefinitely for verification purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Children's Privacy</h2>
            <p>SkillMitra is intended for users aged 16 and above. For users between 16–18, we encourage parental supervision. We provide parent account features to help guardians monitor their child's learning progress.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or an in-platform notification. Continued use of SkillMitra after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact Us</h2>
            <p>For privacy concerns, data requests, or questions about this policy, please contact us at:</p>
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

export default Privacy;
