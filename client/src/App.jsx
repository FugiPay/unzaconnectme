import { Routes, Route } from "react-router-dom";
import Home from "./Home.jsx";
import AdminApp from "./admin/AdminApp.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
