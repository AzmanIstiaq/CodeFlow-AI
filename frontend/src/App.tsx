/**
 * App Root
 *
 * Purpose:
 * - Defines the top-level route map for the frontend application.
 *
 * Role in the system:
 * - Serves as the main routing entry point for page-level navigation.
 *
 * Key responsibilities:
 * - Configure route paths and their associated page components.
 *
 * Important constraints and assumptions:
 * - Routes are declared in a single place to keep navigation consistent.
 * - No route guards are applied here; any access control is handled by pages.
 */

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import PageBuilder from "./pages/PageBuilder";

// ================================
// Component
// ================================
/**
 * App root component that wires page-level routes.
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pageBuilder" element={<PageBuilder />} />
      </Routes>
    </Router>
  );
}

export default App;
