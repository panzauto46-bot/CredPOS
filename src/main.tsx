import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// Setup back button handler for Android
if (Capacitor.isNativePlatform()) {
  CapacitorApp.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    }
    // Don't exit app - let native MainActivity handle double-tap to exit
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
