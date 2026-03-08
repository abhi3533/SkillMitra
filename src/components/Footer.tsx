import { Link } from "react-router-dom";
import { Shield, BadgeCheck, IndianRupee, Video } from "lucide-react";
import SkillMitraLogo from "@/components/SkillMitraLogo";

const trustBadges = [
  { icon: Shield, label: "Secure Payments", sub: "Powered by Razorpay" },
  { icon: BadgeCheck, label: "Verified Trainers", sub: "Document verified" },
  { icon: IndianRupee, label: "Money Back Guarantee", sub: "Within 48 hours" },
  { icon: Video, label: "1000+ Sessions", sub: "Completed on platform" },
];

const Footer = () => {
  return (
    <footer className="bg-foreground">
      {/* Trust Badges */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustBadges.map(badge => (
              <div key={badge.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <badge.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90">{badge.label}</p>
                  <p className="text-[11px] text-white/40">{badge.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <div className="mb-5">
              <SkillMitraLogo darkText={false} height={48} showTagline />
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              India's first 1:1 personal skill training platform. Learn from verified expert trainers from home in your own language.
            </p>
            <p className="text-white/30 text-xs mt-3">A product of Learnvate Solutions Private Limited</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-white/30 mb-5 font-semibold">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: "Browse Trainers", path: "/browse" },
                { label: "How It Works", path: "/how-it-works" },
                { label: "About Us", path: "/about" },
                { label: "Blog", path: "/blog" },
                { label: "Pricing", path: "/pricing" },
                { label: "Verify Certificate", path: "/verify" },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-white/50 hover:text-white transition-colors duration-200">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Trainers */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-white/30 mb-5 font-semibold">For Trainers</h4>
            <ul className="space-y-3">
              {[
                { label: "Become a Trainer", path: "/trainer/signup" },
                { label: "Trainer Login", path: "/trainer/login" },
                { label: "Subscription Plans", path: "/pricing" },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-white/50 hover:text-white transition-colors duration-200">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-white/30 mb-5 font-semibold">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:contact@skillmitra.online" className="text-sm text-white/50 hover:text-white transition-colors duration-200">
                  contact@skillmitra.online
                </a>
              </li>
              <li className="text-sm text-white/50">Mon–Sat, 9:00 AM–6:00 PM IST</li>
              <li>
                <Link to="/contact" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200">
                  Contact Form →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">© 2026 Learnvate Solutions Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link to="/privacy" className="text-xs text-white/30 hover:text-white/50 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-white/30 hover:text-white/50 transition-colors">Terms of Service</Link>
            <Link to="/terms#refund-policy" className="text-xs text-white/30 hover:text-white/50 transition-colors">Refund Policy</Link>
            <Link to="/contact" className="text-xs text-white/30 hover:text-white/50 transition-colors">Contact</Link>
            <Link to="/about" className="text-xs text-white/30 hover:text-white/50 transition-colors">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
