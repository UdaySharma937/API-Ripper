"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  message?: string;
}

/**
 * Generic React error boundary used to wrap dashboard panels (tables,
 * charts) so a rendering failure in one widget never takes down the whole
 * scan dashboard.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("APIRipper UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <p className="font-medium text-red-400">
            {this.props.fallbackTitle ?? "Something went wrong rendering this panel."}
          </p>
          {this.state.message && (
            <p className="max-w-md text-xs text-slate-500">{this.state.message}</p>
          )}
          <Button size="sm" variant="outline" onClick={() => this.setState({ hasError: false })}>
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
