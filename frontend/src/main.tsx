import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@twelvelabs-io/react";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </StrictMode>
);
