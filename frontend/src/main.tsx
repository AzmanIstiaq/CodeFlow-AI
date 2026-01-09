/**
 * Application Bootstrap
 *
 * Purpose:
 * - Initialize the React application and attach it to the DOM.
 *
 * Role in the system:
 * - Serves as the entry point for client-side rendering and global styles.
 *
 * Key responsibilities:
 * - Load global CSS dependencies in a controlled order.
 * - Render the root React component into the DOM.
 *
 * Important constraints and assumptions:
 * - The root element with id "root" must exist in the HTML template.
 * - Style import order is significant and should remain stable.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/theme.css";
import "./styles/base.css";
import "./styles/vendor.css";
import "./styles/bootstrap-overrides.css";
import "./styles/landing.css";
import "./styles/builder.css";
import "./styles/visualbuilder.css";
import "./styles/dashboard.css";
import App from "./App.tsx";

// ================================
// Bootstrapping
// ================================
// Mount the app into the root DOM container.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
