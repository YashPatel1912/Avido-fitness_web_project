import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { UserProvider } from "./store/token.jsx";
import "./App.css";
import ResponsiveToast from "./components/layout/ResponsiveToast.jsx";

createRoot(document.getElementById("root")).render(
  <UserProvider>
    <StrictMode>
      <App />
      <ResponsiveToast />
    </StrictMode>
  </UserProvider>,
);
