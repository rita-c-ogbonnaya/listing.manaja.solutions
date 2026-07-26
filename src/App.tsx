import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { CookieConsent } from "@/components/CookieConsent";
import { WelcomePopup } from "@/components/WelcomePopup";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import Index from "./pages/Index";
import {
  installOfflineQueueListener,
  flushPendingSubmissions,
} from "@/lib/form-submissions";

const ModulesPage = lazy(() => import("./pages/Modules"));
const RoadmapPage = lazy(() => import("./pages/Roadmap"));
const AboutPage = lazy(() => import("./pages/About"));
const ContactPage = lazy(() => import("./pages/Contact"));
function EarlyAccessRedirect() {
  useEffect(() => { window.location.replace("https://app.manaja.solutions/"); }, []);
  return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Redirecting…</div>;
}
const CareersPage = lazy(() => import("./pages/Careers"));
const ComingSoonPage = lazy(() => import("./pages/ComingSoon"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicy"));
const TermsOfUsePage = lazy(() => import("./pages/TermsOfUse"));
const SupportPage = lazy(() => import("./pages/Support"));
const AdminSubmissionsPage = lazy(() => import("./pages/AdminSubmissions"));
const BlogPage = lazy(() => import("./pages/Blog"));
const BlogPostPage = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const cleanup = installOfflineQueueListener();
    // Try once on app start in case there are stale jobs.
    flushPendingSubmissions().catch(() => {});
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AnimatedBackground />
          <Header />
        <main className="relative z-10 min-h-screen">
          <Suspense fallback={<div className="min-h-screen" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/modules" element={<ModulesPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/early-access" element={<EarlyAccessRedirect />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/coming-soon" element={<ComingSoonPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/cookie-policy" element={<CookiePolicyPage />} />
              <Route path="/terms-of-use" element={<TermsOfUsePage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/admin" element={<AdminSubmissionsPage />} />
              <Route path="/admin/submissions" element={<Navigate to="/admin" replace />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/api-reference" element={<ComingSoonPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <WhatsAppWidget />
        <ScrollToTopButton />
        <CookieConsent />
        <WelcomePopup />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
