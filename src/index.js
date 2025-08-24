import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function hideLoadingScreen() {
  const loading = document.getElementById("loading");
  const root = document.getElementById("root");

  // This is the core logic: find the elements and change their display styles
  if (loading && root) {
    loading.style.display = "none";
    root.style.display = "block";
  }
}

// Create root element and render app
const root = ReactDOM.createRoot(document.getElementById("root"));

// Error boundary for better error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <h2>Something went wrong</h2>
          <p>Please restart the application.</p>
          <details style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Render the app with error boundary
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
hideLoadingScreen();
