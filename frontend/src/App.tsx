import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/home";
import VisualBuilder from "./pages/visualbuilder";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<VisualBuilder />} />
      </Routes>
    </Router>
  )
}

export default App;
