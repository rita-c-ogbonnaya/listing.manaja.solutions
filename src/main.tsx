import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

const redirectedPath = window.sessionStorage.getItem("spa-redirect");

if (redirectedPath) {
  window.sessionStorage.removeItem("spa-redirect");
  window.history.replaceState(null, "", redirectedPath);
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
