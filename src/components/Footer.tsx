import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-bold text-sm text-primary-foreground">S</span>
              </div>
              <span className="text-xl font-bold text-white">
                Skill<span className="text-accent">Mitra</span>
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              India's first 1:1 personal skill training platform. Learn from verified expert trainers from home in your own language.
            </p>
            {/* Social */}
            <div className="flex gap-3 mt-6">
              {["LinkedIn", "Instagram", "Twitter", "YouTube"].map(s => (
                <a key={s} href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" aria-label={s}>
                  <span className="text-white/40 text-xs font-medium">{s[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-label uppercase tracking-widest text-white/30 mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: "Browse Trainers", path: "/browse" },
                { label: "Student Signup", path: "/student/signup" },
                { label: "Student Login", path: "/student/login" },
                { label: "AI Interview Prep", path: "/student/interview" },
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
            <h4 className="text-label uppercase tracking-widest text-white/30 mb-5">For Trainers</h4>
            <ul className="space-y-3">
              {[
                { label: "Become a Trainer", path: "/trainer/signup" },
                { label: "Trainer Login", path: "/trainer/login" },
                { label: "Subscription Plans", path: "/trainer/subscription" },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-white/50 hover:text-white transition-colors duration-200">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-label uppercase tracking-widest text-white/30 mb-5">Contact</h4>
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
          <p className="text-sm text-white/30">© 2026 SkillMitra. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xs text-white/30 hover:text-white/50 transition-colors">Privacy Policy</Link>
            <Link to="/" className="text-xs text-white/30 hover:text-white/50 transition-colors">Terms of Service</Link>
            <span className="text-xs text-white/20">Made with ❤️ in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
