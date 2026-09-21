"use client";

import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-red-600 mb-2">Lỗi hiển thị</h1>
          <pre className="text-xs bg-neutral-100 dark:bg-neutral-900 p-3 rounded overflow-x-auto whitespace-pre-wrap">
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-3 px-4 py-2 rounded bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black text-sm"
          >
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
