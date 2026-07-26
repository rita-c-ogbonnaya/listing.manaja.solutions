import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scrolls the window to the top whenever the route pathname changes
 * (except for browser back/forward, which should restore the prior position).
 */
export function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  // Take control away from the browser's automatic scroll restoration so it
  // can't fight us by re-applying a stale scroll position after navigation.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      const prev = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = prev;
      };
    }
  }, []);

  // useLayoutEffect runs synchronously before paint, so the new page never
  // flashes at the previous scroll position.
  useLayoutEffect(() => {
    if (navType === "POP") return; // back/forward — let the browser restore
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, navType]);

  return null;
}
