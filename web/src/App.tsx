import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ListingsPage from "./pages/ListingsPage";
import SourcesPage from "./pages/SourcesPage";

function NavLink({ to, label }: { to: string; label: string }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link className={`nav-link ${active ? "active" : ""}`} to={to}>
      {label}
    </Link>
  );
}

export default function App() {
  return (
    <div className="app">
      <header>
        <div className="brand">Find House</div>
        <nav>
          <NavLink to="/" label="Dashboard" />
          <NavLink to="/listings" label="Listings" />
          <NavLink to="/sources" label="Sources" />
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
