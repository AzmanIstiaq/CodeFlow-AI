import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import PageBuilder from "./pages/PageBuilder";

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
