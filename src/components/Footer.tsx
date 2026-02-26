import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[hsl(210,50%,14%)]">
      <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <span className="text-[22px] font-bold tracking-tight text-white">
              Skill<span className="text-gradient">Mitra</span>
            </span>
            <p className="mt-4 text-white/40 text-[15px] leading-relaxed max-w-sm">
              AI-powered 1-on-1 software training platform connecting students with real engineers for personalized career training.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-5">Product</h4>
            <ul className="space-y-3">
              {[
                { label: "Browse Trainers", path: "/browse" },
                { label: "How It Works", path: "/how-it-works" },
                { label: "Pricing", path: "/pricing" },
                { label: "Verify Certificate", path: "/verify" },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-[14px] text-white/40 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-5">Company</h4>
            <ul className="space-y-3">
              {[
                { label: "About", path: "/about" },
                { label: "Contact", path: "/contact" },
                { label: "Become a Trainer", path: "/trainer/signup" },
                { label: "Standards", path: "/standards" },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-[14px] text-white/40 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-5">Legal</h4>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy", path: "/privacy" },
                { label: "Terms of Service", path: "/terms" },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-[14px] text-white/40 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
              <li>
                <a href="mailto:Contact@skillmitra.online" className="text-[14px] text-white/40 hover:text-white transition-colors">
                  Contact@skillmitra.online
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-white/25">© 2026 SkillMitra. All rights reserved.</p>
          <p className="text-[13px] text-white/15">Built in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
