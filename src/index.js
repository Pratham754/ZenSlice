import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CustomThemeProvider } from "./ThemeContext";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
          <h2>Something went wrong</h2>
          <p>Please restart the application.</p>
          <details style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
            {this.state.error?.toString()}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const loading = document.getElementById("loading");
const rootEl = document.getElementById("root");
if (loading && rootEl) {
  loading.style.display = "none";
  rootEl.style.display = "block";
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <CustomThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </CustomThemeProvider>
  </React.StrictMode>
);
