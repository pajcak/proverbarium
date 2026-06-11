import { Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ScrollToTop } from "./components/ScrollToTop";
import { HomePage } from "./pages/HomePage";
import { ProverbDetailPage } from "./pages/ProverbDetailPage";

export default function App() {
  const location = useLocation();

  return (
    <AppLayout>
      <ScrollToTop />
      {/* Re-keying on pathname gives every navigation a quiet fade + rise. */}
      <div key={location.pathname} className="page-enter">
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/proverb/:id" element={<ProverbDetailPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </AppLayout>
  );
}
