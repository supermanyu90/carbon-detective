import { Component, type ErrorInfo, type ReactNode } from "react";
import { clearWip } from "../lib/storage";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Catches render errors so a single bad component never blanks the whole app.
 *  Offers to clear a possibly-corrupt saved case, which would otherwise crash
 *  again on reload (the app restores straight into the saved step). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Carbon Detective crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="wrap">
        <div className="card" role="alert">
          <p className="eyebrow">Environmental Investigation Unit</p>
          <h2 className="disp" style={{ fontSize: "1.5rem", marginTop: 4 }}>
            🚧 The case file jammed
          </h2>
          <p style={{ marginTop: 8 }}>
            Something went wrong while drawing this screen. Your past reports are safe.
          </p>
          <pre
            className="mono"
            style={{
              whiteSpace: "pre-wrap",
              fontSize: ".82rem",
              color: "var(--ink-soft)",
              margin: "12px 0",
            }}
          >
            {this.state.error.message}
          </pre>
          <div className="actions-row">
            <button className="btn" onClick={() => location.reload()}>
              🔄 Reload
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                clearWip();
                location.reload();
              }}
            >
              🗂️ Discard the in-progress case &amp; reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
