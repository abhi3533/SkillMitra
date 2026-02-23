import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center">
                <span className="font-bold text-lg text-accent-foreground">S</span>
              </div>
              <span className="text-xl font-bold">
                Skill<span className="text-accent">Mitra</span>
              </span>
            </div>
            <p className="text-primary-foreground/60 text-sm leading-relaxed">
              India's first 1:1 personal skill training platform. Learn from verified expert trainers from home in your own language.
            </p>
          </div>

          {/* For Students */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/40">For Students</h4>
            <ul className="space-y-3">
              <li><Link to="/browse" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Browse Trainers</Link></li>
              <li><Link to="/student/signup" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Sign Up</Link></li>
              <li><Link to="/student/login" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Student Login</Link></li>
              <li><Link to="/student/interview" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">AI Interview</Link></li>
            </ul>
          </div>

          {/* For Trainers */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/40">For Trainers</h4>
            <ul className="space-y-3">
              <li><Link to="/trainer/signup" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Become a Trainer</Link></li>
              <li><Link to="/trainer/login" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Trainer Login</Link></li>
              <li><Link to="/trainer/subscription" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Subscription Plans</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/40">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link to="/" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link to="/" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/40">© 2026 SkillMitra. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-primary-foreground/30">Made with ❤️ in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
