import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

import policyMarkdown from "../content/PRIVACY_POLICY.md?raw";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 animated-grid opacity-30" />
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  Privacy Policy
                </h1>
                <p className="text-muted-foreground mt-2">
                  How RepoMax collects, uses, and protects your information.
                </p>
              </div>

              <Link to="/analyze">
                <Button variant="hero">Try RepoMax</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="glass rounded-2xl p-6 md:p-8">
              <article className="prose prose-zinc dark:prose-invert max-w-none">
                <ReactMarkdown>{policyMarkdown}</ReactMarkdown>
              </article>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

