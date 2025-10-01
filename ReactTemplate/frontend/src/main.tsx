import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import MyCalendar from "./assets/components/MyCalendar";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MyCalendar />
  </StrictMode>
);
