import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Crown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { trackEvent } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { label: "Analyses per month", free: "3", pro: "Unlimited" },
  { label: "History & trends", free: "—", pro: "✓" },
  { label: "Saved READMEs", free: "—", pro: "✓" },
  { label: "Export (PDF/CSV)", free: "—", pro: "✓" },
  { label: "Priority support", free: "—", pro: "✓" },
];

const testimonials = [
  {
    name: "Sam, SWE",
    quote: "RepoMax helped me ship a README that actually matches the job description.",
  },
  {
    name: "Leah, PM",
    quote: "The analysis history makes it easy to iterate before interviews.",
  },
  {
    name: "Diego, New Grad",
    quote: "Upgrading was the fastest way to stop worrying about limits.",
  },
];

export default function UpgradePage() {
  const { tier } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const joinWaitlist = async () => {
    setSubmitting(true);
    try {
      await trackEvent("upgrade_interest", { source: "upgrade_page" });
      // No backend yet — store locally for demo and future wiring.
      try {
        const key = "repomax:waitlist";
        const existing = JSON.parse(localStorage.getItem(key) || "[]") as string[];
        const next = Array.from(new Set([...(existing || []), email.trim()].filter(Boolean)));
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // no-op
      }
      toast({
        title: "You’re on the waitlist",
        description: "We’ll email you when Pro is ready.",
      });
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 animated-grid opacity-30" />
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Upgrade</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Go <span className="gradient-text">Pro</span>
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Unlimited analyses, full history, exports, and faster iteration when you’re job hunting.
              </p>
            </div>
            {tier === "pro" ? (
              <span className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <Check className="w-4 h-4" />
                You’re Pro
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                <Crown className="w-4 h-4 text-yellow-400" />
                Free plan
              </span>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comparison */}
          <Card className="glass border-white/10 bg-background/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Free vs Pro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-3 text-sm bg-white/5">
                  <div className="p-3 font-medium">Feature</div>
                  <div className="p-3 font-medium text-muted-foreground">Free</div>
                  <div className="p-3 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      Pro
                    </span>
                  </div>
                </div>
                {features.map((f) => (
                  <div key={f.label} className="grid grid-cols-3 text-sm border-t border-white/10">
                    <div className="p-3 text-muted-foreground">{f.label}</div>
                    <div className="p-3">{f.free}</div>
                    <div className="p-3">{f.pro}</div>
                  </div>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Social proof:</span> 50+ upgraded
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {testimonials.map((t) => (
                  <div key={t.name} className="glass rounded-xl border border-white/10 p-4">
                    <p className="text-sm text-foreground">“{t.quote}”</p>
                    <div className="text-xs text-muted-foreground mt-3">{t.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="glass border-white/10 bg-background/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="glass rounded-2xl border border-white/10 p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Pro</div>
                    <div className="font-display text-4xl font-bold">$12</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                    Coming soon
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm">
                  {[
                    "Unlimited analyses",
                    "History & trends",
                    "Saved READMEs",
                    "Export PDFs/CSVs",
                    "Priority support",
                  ].map((x) => (
                    <div key={x} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{x}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="waitlist-email">
                  Join the waitlist
                </label>
                <div className="flex gap-2">
                  <Input
                    id="waitlist-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button
                    variant="hero"
                    onClick={joinWaitlist}
                    disabled={submitting || !email.trim().includes("@")}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  No spam. One email when Pro is available.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

