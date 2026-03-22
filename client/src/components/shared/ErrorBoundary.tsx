import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
  title?: string;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    // Avoid logging sensitive user data; keep it minimal.
    if (import.meta.env.DEV) {
      console.error("[ui] render error", err);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-6 max-w-md w-full text-center">
          <h2 className="font-display text-xl font-bold text-foreground">
            {this.props.title ?? "Something went wrong"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Please refresh the page and try again.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                this.setState({ hasError: false });
              }}
            >
              Try again
            </Button>
            <Button
              variant="hero"
              onClick={() => {
                window.location.reload();
              }}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

