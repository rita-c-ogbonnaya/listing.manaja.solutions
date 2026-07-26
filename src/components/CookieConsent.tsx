import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  functionality: boolean;
  targeting: boolean;
};

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  functionality: false,
  targeting: false,
};

const sendCookiePreferences = async (prefs: CookiePreferences, status: string) => {
  try {
    await supabase.functions.invoke("send-cookie-preferences", {
      body: {
        status,
        preferences: prefs,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      },
    });
  } catch (err) {
    console.error("Failed to log cookie preferences:", err);
  }
};

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setShowSettings(true);
      setShow(true);
    };
    window.addEventListener("open-cookie-settings", handler);
    return () => window.removeEventListener("open-cookie-settings", handler);
  }, []);

  const save = (prefs: CookiePreferences, status: string) => {
    localStorage.setItem("cookie-consent", status);
    localStorage.setItem("cookie-preferences", JSON.stringify(prefs));
    setShow(false);
    setShowSettings(false);
    sendCookiePreferences(prefs, status);
  };

  const accept = () => save({ necessary: true, analytics: true, functionality: true, targeting: true }, "accepted");
  const decline = () => save(defaultPreferences, "declined");
  const saveCustom = () => save(preferences, "custom");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed inset-x-0 bottom-0 z-50 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:px-4 sm:pb-4 pointer-events-none"
        >
          <div className="mx-auto w-full max-w-[calc(100vw-1rem)] sm:max-w-4xl pointer-events-auto">
            <div className="bg-card/95 border border-border rounded-2xl shadow-xl backdrop-blur-md p-3 sm:p-6 overflow-hidden">
              {!showSettings ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <Cookie className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground text-left text-pretty min-w-0 break-words">
                      We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{" "}
                      <Link to="/cookie-policy" className="text-primary hover:underline whitespace-nowrap">Learn more</Link>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:justify-end shrink-0">
                    <div className="flex flex-row gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" onClick={decline} className="h-10 sm:h-11 flex-1 sm:flex-none sm:w-auto px-3 sm:px-4 text-xs sm:text-sm">Decline</Button>
                      <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="h-10 sm:h-11 flex-1 sm:flex-none sm:w-auto px-3 sm:px-4 gap-1.5 text-xs sm:text-sm">
                        <Settings2 className="h-3.5 w-3.5" />
                        <span>Custom</span>
                      </Button>
                    </div>
                    <Button size="sm" onClick={accept} className="btn-glass-primary text-primary-foreground border-0 h-10 sm:h-11 w-full sm:w-auto px-5 text-xs sm:text-sm">
                      <span>Accept All</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">Cookie Preferences</h3>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <Checkbox checked disabled />
                      <div>
                        <span className="text-sm font-medium text-foreground">Strictly Necessary</span>
                        <p className="text-xs text-muted-foreground">Required for the site to function. Always active.</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox checked={preferences.analytics} onCheckedChange={(c) => setPreferences((p) => ({ ...p, analytics: !!c }))} />
                      <div>
                        <span className="text-sm font-medium text-foreground">Analytics</span>
                        <p className="text-xs text-muted-foreground">Help us understand how visitors interact with our site.</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox checked={preferences.functionality} onCheckedChange={(c) => setPreferences((p) => ({ ...p, functionality: !!c }))} />
                      <div>
                        <span className="text-sm font-medium text-foreground">Functionality</span>
                        <p className="text-xs text-muted-foreground">Remember your preferences and settings.</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox checked={preferences.targeting} onCheckedChange={(c) => setPreferences((p) => ({ ...p, targeting: !!c }))} />
                      <div>
                        <span className="text-sm font-medium text-foreground">Targeting</span>
                        <p className="text-xs text-muted-foreground">Used to show relevant content and measure campaigns.</p>
                      </div>
                    </label>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                    <Button variant="outline" size="sm" onClick={() => setShowSettings(false)} className="h-11 w-full sm:w-auto px-4">Back</Button>
                    <Button size="sm" onClick={saveCustom} className="btn-glass-primary text-primary-foreground border-0 h-11 w-full sm:w-auto px-5">Save Preferences</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
