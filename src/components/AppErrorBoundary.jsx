import { Component } from "react";

export default class AppErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) {
    console.error("[AppErrorBoundary]", error?.message || error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h1 className="text-lg font-semibold">Something went wrong.</h1>
          <p className="text-sm opacity-80">Try refreshing or navigating back.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
