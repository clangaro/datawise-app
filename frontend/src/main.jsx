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
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0B1220",
              color: "#E8F4FF",
              border: "1px solid #1E3A5F",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12,
              letterSpacing: "0.06em",
              boxShadow: "0 0 30px #00E5FF22, inset 0 0 0 1px #00E5FF10",
            },
            success: {
              iconTheme: { primary: "#36F1CB", secondary: "#05080F" },
            },
            error: {
              iconTheme: { primary: "#FF3B5C", secondary: "#05080F" },
              style: {
                background: "#0B1220",
                color: "#E8F4FF",
                border: "1px solid #FF3B5C66",
                boxShadow: "0 0 30px #FF3B5C22",
              },
            },
          }}
        />
      </AnalysisProvider>
    </BrowserRouter>
  </React.StrictMode>
);
