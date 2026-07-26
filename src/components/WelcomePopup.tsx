import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Settings = {
  popup_enabled: boolean;
  popup_image_url: string | null;
  popup_title: string;
  popup_body: string;
  popup_cta_label: string;
  popup_cta_url: string;
  popup_version: number;
};

export function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<Settings | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("site_settings")
        .select("popup_enabled, popup_image_url, popup_title, popup_body, popup_cta_label, popup_cta_url, popup_version")
        .eq("id", 1)
        .maybeSingle();
      const row = data as Settings | null;
      if (cancelled || !row || !row.popup_enabled) return;
      setS(row);
      // Preload the image so it appears fully on open (no half-loaded reveal)
      if (row.popup_image_url) {
        const img = new Image();
        img.onload = () => { if (!cancelled) { setImgLoaded(true); setOpen(true); } };
        img.onerror = () => { if (!cancelled) { setImgLoaded(true); setOpen(true); } };
        img.src = row.popup_image_url;
      } else {
        setImgLoaded(true);
        setTimeout(() => setOpen(true), 400);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function close() {
    setOpen(false);
  }

  if (!s) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-popup-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md sm:max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-background/80 hover:bg-background border border-border flex items-center justify-center text-foreground shadow"
            >
              <X className="h-4 w-4" />
            </button>

            {s.popup_image_url && (
              <div className="bg-black">
                <img
                  src={s.popup_image_url}
                  alt={s.popup_title}
                  className="w-full h-auto block max-h-[60vh] object-contain"
                  loading="eager"
                />
              </div>
            )}

            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="shrink-0 h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 id="welcome-popup-title" className="text-lg font-bold text-foreground">{s.popup_title}</h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.popup_body}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-5">
                {s.popup_cta_url && s.popup_cta_label && (
                  s.popup_cta_url.startsWith("http") ? (
                    <a
                      href={s.popup_cta_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={close}
                      className="btn-glass-primary inline-flex items-center justify-center rounded-full px-4 h-10 text-sm font-semibold text-primary-foreground border-0"
                    >
                      {s.popup_cta_label}
                    </a>
                  ) : (
                    <Link
                      to={s.popup_cta_url}
                      onClick={close}
                      className="btn-glass-primary inline-flex items-center justify-center rounded-full px-4 h-10 text-sm font-semibold text-primary-foreground border-0"
                    >
                      {s.popup_cta_label}
                    </Link>
                  )
                )}
                <button
                  onClick={close}
                  className="inline-flex items-center justify-center rounded-full px-4 h-10 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
