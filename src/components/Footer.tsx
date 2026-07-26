import { Link } from "react-router-dom";
import { Linkedin, Twitter, Instagram} from "lucide-react";
import logoImg from "@/assets/manajalogo.png";


const footerLinks = {
  product: [
    { label: "Modules", href: "/modules" },
    { label: "Pricing", href: "/early-access" },
    { label: "Roadmap", href: "/roadmap" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Get in Touch", href: "/contact" },
  ],
  resources: [
    { label: "Blog", href: "/coming-soon" },
    { label: "Support", href: "/support" },
    { label: "API Reference", href: "/coming-soon" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Cookie Policy", href: "/cookie-policy" },
    { label: "Terms of Use", href: "/terms-of-use" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "https://x.com/ManajaSolutions", label: "Twitter" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/manaja-solutions/", label: "LinkedIn" },
  { icon: Instagram, href: "https://www.instagram.com/manaja.solutions/", label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Link to="/" className="flex items-left">
                          <img src={logoImg} alt="Manaja" className="h-14 sm:h-16 md:h-20 w-auto object-contain" />
                        </Link>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Unifying enterprise operations with intelligent, modular software solutions for growing organizations.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()}  Manaja Solutions Limited. All rights reserved.
          </p>
          <span className="hidden sm:inline text-muted-foreground">·</span>
          <button
            onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Manage Cookies
          </button>
        </div>
      </div>
    </footer>
  );
}
