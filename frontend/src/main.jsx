import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AnalysisProvider } from "./context/AnalysisContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AnalysisProvider>
        <App />
        <Toaster position="top-right" />
      </AnalysisProvider>
    </BrowserRouter>
  </React.StrictMode>
);
