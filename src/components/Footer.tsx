import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <div className="flex items-center mb-5">
              <span className="text-[22px] font-bold" style={{ fontFamily: "Inter, sans-serif" }}>
                <span style={{ color: "#FFFFFF" }}>Skill</span><span style={{ color: "#6EA8FE" }}>Mitra</span>
              </span>
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
                <a href="mailto:Contact@skillmitra.online" className="text-sm text-white/50 hover:text-white transition-colors duration-200">
                  Contact@skillmitra.online
                </a>
              </li>
              <li className="text-sm text-white/50">Mon – Sat, 9am – 6pm IST</li>
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
            <Link to="/contact" className="text-xs text-white/30 hover:text-white/50 transition-colors">Contact</Link>
            <Link to="/about" className="text-xs text-white/30 hover:text-white/50 transition-colors">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
