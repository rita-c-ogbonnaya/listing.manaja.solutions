import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/manajalogo.png";

type NavChild = { href: string; label: string; description?: string };
type NavItem = { label: string; href?: string; children?: NavChild[] };

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Our Suite",
    children: [
      { href: "/modules", label: "Modules", description: "Explore every Manaja module" },
      { href: "/roadmap", label: "Roadmap", description: "What we're shipping next" },
    ],
  },
  { label: "About", href: "/about" },
  {
    label: "Resources",
    children: [
      { href: "/api-reference", label: "API Reference", description: "Build on top of Manaja" },
      { href: "/blog", label: "Blog", description: "Insights and product news" },
    ],
  },
  {
    label: "Get in Touch",
    children: [
      { href: "/contact", label: "Contact us", description: "Talk to our team" },
      { href: "/support", label: "Support", description: "Get help, fast" },
    ],
  },
];

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.href && item.href === pathname) return true;
  if (item.children) return item.children.some((c) => c.href === pathname);
  return false;
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
    setOpenMobileGroup(null);
  }, [location.pathname]);

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled ? "py-2" : "py-3 sm:py-4"
        )}
      >
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-px transition-opacity duration-500 pointer-events-none",
            isScrolled ? "opacity-100" : "opacity-0"
          )}
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.5) 30%, hsl(var(--accent) / 0.5) 70%, transparent 100%)",
          }}
        />

        <div className="container mx-auto px-3 sm:px-4">
          <div
            className={cn(
              "relative flex items-center justify-between gap-3 transition-all duration-500",
              "rounded-2xl border",
            isScrolled
                ? "h-14 px-3 sm:px-4 bg-background backdrop-blur-xl border-border/60 shadow-[0_8px_32px_-12px_hsl(var(--primary)/0.15)]"
                : "h-16 px-3 sm:px-4 bg-background backdrop-blur-md border-border/40"
            )}
          >
            {isScrolled && (
              <div
                aria-hidden
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-60"
                style={{
                  background:
                    "radial-gradient(120% 80% at 50% 0%, hsl(var(--primary) / 0.06) 0%, transparent 60%)",
                }}
              />
            )}

            {/* Logo */}
            <Link to="/" className="relative flex items-center gap-2 shrink-0 group">
              <motion.img
                src={logoImg}
                alt="Manaja"
                className={cn(
                  "w-auto object-contain transition-all duration-500",
                  isScrolled ? "h-10 sm:h-12" : "h-12 sm:h-14 md:h-16"
                )}
                whileHover={{ scale: 1.04, rotate: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </Link>

            {/* Desktop Nav */}
            <nav
              ref={navRef}
              onMouseLeave={() => {
                setHoveredIdx(null);
                scheduleClose();
              }}
              className="hidden lg:flex items-center gap-0.5 relative"
            >
              {navItems.map((item, idx) => {
                const active = isItemActive(item, location.pathname);
                const isHovered = hoveredIdx === idx;
                const hasChildren = !!item.children?.length;
                const isOpen = openDropdown === idx;

                const triggerInner = (
                  <>
                    {isHovered && (
                      <motion.span
                        layoutId="navHoverBubble"
                        className="absolute inset-0 rounded-full bg-foreground/[0.06] dark:bg-foreground/[0.08]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      {item.label}
                      {hasChildren && (
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-300",
                            isOpen && "rotate-180"
                          )}
                        />
                      )}
                      {active && !hasChildren && (
                        <motion.span
                          layoutId="navActiveDot"
                          className="block w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </span>
                  </>
                );

                const triggerClasses = cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors duration-300 rounded-full",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                );

                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => {
                      setHoveredIdx(idx);
                      cancelClose();
                      if (hasChildren) setOpenDropdown(idx);
                    }}
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        className={triggerClasses}
                        aria-haspopup="menu"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setOpenDropdown(isOpen ? null : idx)
                        }
                      >
                        {triggerInner}
                      </button>
                    ) : (
                      <Link to={item.href!} className={triggerClasses}>
                        {triggerInner}
                      </Link>
                    )}

                    {/* Dropdown */}
                    {hasChildren && (
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                            onMouseEnter={cancelClose}
                            onMouseLeave={scheduleClose}
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 z-50"
                            role="menu"
                          >
                            <div
                              className={cn(
                                "relative rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl",
                                "shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.25)] overflow-hidden p-2"
                              )}
                            >
                              <div
                                aria-hidden
                                className="absolute inset-0 pointer-events-none opacity-60"
                                style={{
                                  background:
                                    "radial-gradient(80% 60% at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
                                }}
                              />
                              <div className="relative flex flex-col">
                                {item.children!.map((child) => {
                                  const childActive = location.pathname === child.href;
                                  return (
                                    <Link
                                      key={child.href}
                                      to={child.href}
                                      onClick={() => setOpenDropdown(null)}
                                      role="menuitem"
                                      className={cn(
                                        "group flex items-start gap-3 rounded-xl px-3 py-3 transition-all duration-200",
                                        "border border-transparent",
                                        childActive
                                          ? "bg-primary/10 border-primary/20"
                                          : "hover:bg-foreground/[0.04] hover:border-border/60"
                                      )}
                                    >
                                      <span className="flex-1 min-w-0">
                                        <span
                                          className={cn(
                                            "block text-sm font-semibold tracking-tight",
                                            childActive ? "text-primary" : "text-foreground"
                                          )}
                                        >
                                          {child.label}
                                        </span>
                                        {child.description && (
                                          <span className="block text-xs text-muted-foreground mt-0.5">
                                            {child.description}
                                          </span>
                                        )}
                                      </span>
                                      <ArrowUpRight
                                        className={cn(
                                          "h-4 w-4 mt-0.5 shrink-0 transition-all duration-200",
                                          childActive
                                            ? "text-primary opacity-100"
                                            : "text-muted-foreground/50 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                                        )}
                                      />
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="hidden lg:block h-6 w-px bg-border/60 mx-1" />

              <ThemeToggle />

              <Link to="/early-access" className="hidden sm:block">
                <Button
                  className={cn(
                    "btn-glass-gold rounded-full font-semibold border-0 group/cta relative overflow-hidden",
                    "h-9 px-4 text-sm"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    Join Early Access
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
                  </span>
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700 ease-out"
                    style={{
                      background:
                        "linear-gradient(110deg, transparent 30%, hsl(0 0% 100% / 0.35) 50%, transparent 70%)",
                    }}
                  />
                </Button>
              </Link>

              {/* Mobile menu trigger */}
              <button
                className={cn(
                  "lg:hidden relative h-10 w-10 rounded-full flex items-center justify-center",
                  "border border-border/60 bg-card/40 backdrop-blur-md",
                  "transition-all duration-300 hover:border-primary/40 hover:bg-card/70",
                  isMobileMenuOpen && "border-primary/60 bg-primary/5"
                )}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMobileMenuOpen ? (
                    <motion.span
                      key="x"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute"
                    >
                      <X className="h-4 w-4" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute"
                    >
                      <Menu className="h-4 w-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 z-40"
          >
            <div
              className="absolute inset-0 bg-background/95 backdrop-blur-2xl"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-primary/15 blur-[120px]" />
              <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-accent/15 blur-[120px]" />
            </div>

            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-full flex flex-col pt-24 pb-8 px-6 overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-8"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Navigate</span>
                <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </motion.div>

              <nav className="flex flex-col gap-1.5">
                {navItems.map((item, idx) => {
                  const active = isItemActive(item, location.pathname);
                  const hasChildren = !!item.children?.length;
                  const groupOpen = openMobileGroup === item.label;

                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.2 + idx * 0.05,
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {hasChildren ? (
                        <div
                          className={cn(
                            "rounded-2xl border transition-all duration-300 overflow-hidden",
                            active || groupOpen
                              ? "border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
                              : "border-transparent hover:border-border/60"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMobileGroup(groupOpen ? null : item.label)
                            }
                            aria-expanded={groupOpen}
                            className="w-full flex items-center justify-between py-4 px-5 text-left"
                          >
                            <span className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "text-xs font-mono tabular-nums",
                                  active || groupOpen
                                    ? "text-primary"
                                    : "text-muted-foreground/60"
                                )}
                              >
                                0{idx + 1}
                              </span>
                              <span className="text-2xl font-semibold tracking-tight">
                                {item.label}
                              </span>
                            </span>
                            <ChevronDown
                              className={cn(
                                "h-5 w-5 transition-transform duration-300",
                                groupOpen ? "rotate-180 text-primary" : "text-muted-foreground/60"
                              )}
                            />
                          </button>
                          <AnimatePresence initial={false}>
                            {groupOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-4 pt-1 flex flex-col gap-1">
                                  {item.children!.map((child) => {
                                    const childActive = location.pathname === child.href;
                                    return (
                                      <Link
                                        key={child.href}
                                        to={child.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                          "flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200",
                                          childActive
                                            ? "bg-primary/15 text-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                                        )}
                                      >
                                        <span className="flex flex-col">
                                          <span className="text-base font-medium">
                                            {child.label}
                                          </span>
                                          {child.description && (
                                            <span className="text-xs text-muted-foreground/80">
                                              {child.description}
                                            </span>
                                          )}
                                        </span>
                                        <ArrowUpRight className="h-4 w-4 opacity-60" />
                                      </Link>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <Link
                          to={item.href!}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "group flex items-center justify-between py-4 px-5 rounded-2xl transition-all duration-300",
                            "border border-transparent",
                            active
                              ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-card/50 hover:border-border/60"
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={cn(
                                "text-xs font-mono tabular-nums transition-colors",
                                active ? "text-primary" : "text-muted-foreground/60"
                              )}
                            >
                              0{idx + 1}
                            </span>
                            <span className="text-2xl font-semibold tracking-tight">
                              {item.label}
                            </span>
                          </span>
                          <ArrowUpRight
                            className={cn(
                              "h-5 w-5 transition-all duration-300",
                              active
                                ? "text-primary opacity-100"
                                : "text-muted-foreground/40 -translate-x-1 translate-y-1 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                            )}
                          />
                        </Link>
                      )}
                    </motion.div>
                  );
                })}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-auto pt-8"
              >
                <Link
                  to="/early-access"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  <Button className="btn-glass-gold w-full h-14 rounded-2xl text-base font-semibold border-0 group/cta relative overflow-hidden">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Join Early Access
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
                    </span>
                  </Button>
                </Link>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Built in Africa · Engineered for the world
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
