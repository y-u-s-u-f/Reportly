import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    if (typeof console !== "undefined") {
      console.error("[Reportly] render crashed:", error, info?.componentStack);
    }
  }
  handleReload = () => {
    if (typeof window !== "undefined") window.location.href = "/";
  };
  handleRetry = () => {
    this.setState({ error: null });
  };
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 400,
            textAlign: "center",
            color: "var(--color-ink, #0b0b12)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "-0.022em",
              marginBottom: 8,
            }}
          >
            Something broke.
          </div>
          <div
            style={{
              color: "var(--color-ink-muted, #4b4b5a)",
              fontSize: 14,
              lineHeight: 1.5,
              marginBottom: 20,
            }}
          >
            This screen hit an error. You can retry, or head back to the start.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{
                height: 44,
                padding: "0 16px",
                borderRadius: 14,
                border: "1px solid var(--color-line, #e7e7ee)",
                background: "var(--color-surface-2, #f4f4f7)",
                color: "inherit",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                height: 44,
                padding: "0 16px",
                borderRadius: 14,
                border: "none",
                background: "var(--color-primary-600, #4f46e5)",
                color: "white",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
