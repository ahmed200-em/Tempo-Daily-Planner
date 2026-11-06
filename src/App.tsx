import { MotionConfig } from "framer-motion";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./components/Toasts";
import { PlannerProvider } from "./store/PlannerContext";
import PlannerPage from "./pages/PlannerPage";
import StudyPage from "./pages/StudyPage";
import ReportPage from "./pages/ReportPage";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      {/* hash routing keeps deep links working from any static host */}
      <HashRouter>
        <ToastProvider>
          <PlannerProvider>
            <Routes>
              <Route path="/" element={<PlannerPage />} />
              <Route path="/study" element={<StudyPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PlannerProvider>
        </ToastProvider>
      </HashRouter>
    </MotionConfig>
  );
}
