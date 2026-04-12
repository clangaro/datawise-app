import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import Questionnaire from "./pages/Questionnaire.jsx";
import Upload from "./pages/Upload.jsx";
import Assumptions from "./pages/Assumptions.jsx";
import Analysis from "./pages/Analysis.jsx";
import Visualisation from "./pages/Visualisation.jsx";
import Report from "./pages/Report.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"              element={<Landing />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/upload"        element={<Upload />} />
        <Route path="/assumptions"   element={<Assumptions />} />
        <Route path="/analysis"      element={<Analysis />} />
        <Route path="/visualisation" element={<Visualisation />} />
        <Route path="/report"        element={<Report />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
