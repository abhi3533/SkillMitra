import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <span className="text-[18px] font-bold tracking-[-0.02em] text-foreground">
              skill<span className="font-extrabold text-primary">mitra</span>
            </span>
            <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed max-w-xs">
              AI-powered 1-on-1 training platform connecting students with real engineers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">Product</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Trainers", path: "/browse" },
                { label: "How It Works", path: "/how-it-works" },
                { label: "Pricing", path: "/pricing" },
              ].map(l => (
                <li key={l.path}><Link to={l.path} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">Company</h4>
            <ul className="space-y-2.5">
              {[
                { label: "About", path: "/about" },
                { label: "Contact", path: "/contact" },
                { label: "Become a Trainer", path: "/trainer/signup" },
              ].map(l => (
                <li key={l.path}><Link to={l.path} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Privacy", path: "/privacy" },
                { label: "Terms", path: "/terms" },
              ].map(l => (
                <li key={l.path}><Link to={l.path} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>
              ))}
              <li>
                <a href="mailto:Contact@skillmitra.online" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Contact@skillmitra.online
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/60 flex items-center justify-between">
          <p className="text-[12px] text-muted-foreground/60">© 2026 SkillMitra</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
