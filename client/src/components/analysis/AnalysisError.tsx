import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalysisErrorProps {
  errorType: 'user-not-found' | 'url-invalid' | 'api-error' | 'unknown';
  onRetry?: () => void;
}

const errorMessages = {
  'user-not-found': {
    title: "GitHub User Not Found",
    message: "We couldn't find a GitHub profile with that username. Please check the spelling and try again.",
    suggestion: "Make sure your GitHub profile is public and the username is correct.",
  },
  'url-invalid': {
    title: "Job URL Not Accessible",
    message: "We couldn't access the job posting URL. Make sure it's a publicly accessible link.",
    suggestion: "Try copying the full URL from your browser's address bar.",
  },
  'api-error': {
    title: "Analysis Failed",
    message: "Something went wrong during the analysis. This is usually temporary.",
    suggestion: "Wait a moment and try again. If the problem persists, contact support.",
  },
  'unknown': {
    title: "Unexpected Error",
    message: "An unexpected error occurred. We're working on fixing it.",
    suggestion: "Please try again or contact support if the issue continues.",
  },
};

export function AnalysisError({ errorType, onRetry }: AnalysisErrorProps) {
  const error = errorMessages[errorType];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass rounded-2xl p-8 text-center border border-destructive/30"
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center"
          >
            <AlertCircle className="w-8 h-8 text-destructive" />
          </motion.div>

          {/* Error Title */}
          <h2 className="font-display text-2xl font-bold mb-3 text-foreground">
            {error.title}
          </h2>

          {/* Error Message */}
          <p className="text-muted-foreground mb-4">
            {error.message}
          </p>

          {/* Suggestion */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border mb-6">
            <div className="flex items-start gap-3 text-left">
              <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {error.suggestion}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/analyze" className="flex-1">
              <Button variant="hero-outline" size="lg" className="w-full">
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
            </Link>
            {onRetry && (
              <Button variant="hero" size="lg" className="flex-1" onClick={onRetry}>
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
          </div>

          {/* Support Link */}
          <p className="text-sm text-muted-foreground mt-6">
            Still having issues?{" "}
            <a href="mailto:support@readyrepo.dev" className="text-primary hover:underline">
              Contact support
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}