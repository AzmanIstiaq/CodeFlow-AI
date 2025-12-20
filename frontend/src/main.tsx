import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/theme.css";
import "./styles/base.css";
import "./styles/vendor.css";
import "./styles/bootstrap-overrides.css";
import "./styles/landing.css";
import "./styles/builder.css";
import "./styles/dashboard.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
