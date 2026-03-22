import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const freeTier = {
  name: "Free",
  price: "0",
  description: "Perfect for getting started",
  features: [
    "3 analyses per month",
    "Basic scoring & recommendations",
    "1 README generation per analysis",
    "Job posting URL analysis",
    "Email support",
  ],
  cta: "Start Free",
  highlighted: false,
};

const proTier = {
  name: "Pro",
  price: "12",
  originalPrice: "15",
  description: "For serious job hunters",
  features: [
    "Unlimited analyses",
    "Track improvements over time",
    "Bulk README generation",
    "PDF reports & exports",
    "Priority support",
    "Custom tone presets",
  ],
  cta: "Join Waitlist",
  highlighted: true,
  badge: "Coming Soon",
};

export function PricingSection() {
  const waitlistUrl = "https://tally.so/r/Gx1gBQ";

  return (
    <section id="pricing" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-secondary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Start Optimizing Your{" "}
            <span className="gradient-text">GitHub Today</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your job search journey.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass rounded-2xl p-8"
          >
            <div className="mb-6">
              <h3 className="font-display text-2xl font-bold mb-2">{freeTier.name}</h3>
              <p className="text-muted-foreground text-sm">{freeTier.description}</p>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-bold">${freeTier.price}</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {freeTier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/analyze" className="block">
              <Button variant="hero-outline" size="lg" className="w-full">
                {freeTier.cta}
              </Button>
            </Link>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-primary/50 to-secondary opacity-50 blur-sm" />
            
            <div className="relative glass rounded-2xl p-8 border border-primary/30">
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-secondary">
                  <Clock className="w-3.5 h-3.5 text-primary-foreground" />
                  <span className="text-xs font-semibold text-primary-foreground">
                    {proTier.badge}
                  </span>
                </div>
              </div>

              <div className="mb-6 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-display text-2xl font-bold">{proTier.name}</h3>
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm">{proTier.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold gradient-text">${proTier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <span className="text-sm text-muted-foreground line-through">
                  ${proTier.originalPrice}/month
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {proTier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={() => window.open(waitlistUrl, "_blank", "noopener,noreferrer")}
              >
                {proTier.cta}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}