import { motion } from "framer-motion";
import { Brain, Lightbulb, FileText, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Fit Scoring",
    description: "Gemini AI analyzes your actual code repositories against job requirements. Get a detailed score breakdown showing technical skills match, experience alignment, and project relevance.",
    stat: "Analyze unlimited repos",
    visual: "score",
  },
  {
    icon: Lightbulb,
    title: "Gap Analysis + Recommendations",
    description: "See exactly what's missing and get actionable steps to improve. Prioritized by impact with time estimates. Know what to fix first.",
    stat: "Personalized advice in seconds",
    visual: "gaps",
  },
  {
    icon: FileText,
    title: "Tone-Matched README Creation",
    description: "Our AI detects the company's culture from the job posting and generates a professional README that matches their tone. Startup? Get energetic. Corporate? Get formal.",
    stat: "Save 2+ hours per application",
    visual: "readme",
  },
];

function ScoreVisual() {
  return (
    <div className="flex items-center justify-center py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-24 h-24"
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 0.87 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(187 94% 44%)" />
              <stop offset="100%" stopColor="hsl(330 81% 60%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold gradient-text"
          >
            87%
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
}

function GapsVisual() {
  const items = [
    { label: "TypeScript proficiency", isStrength: true },
    { label: "React experience", isStrength: true },
    { label: "API documentation", isStrength: false },
    { label: "Testing coverage", isStrength: false },
  ];

  return (
    <div className="py-4 space-y-2">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + index * 0.1 }}
          className="flex items-center gap-2 text-sm"
        >
          {item.isStrength ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
          <span className="text-muted-foreground">{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

function ReadmeVisual() {
  return (
    <div className="py-4 flex items-center gap-4">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-1 p-3 rounded-lg bg-muted/30 border border-border"
      >
        <div className="text-xs text-muted-foreground mb-1">Before</div>
        <div className="h-2 w-full bg-muted rounded mb-1" />
        <div className="h-2 w-3/4 bg-muted rounded" />
      </motion.div>
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Sparkles className="w-5 h-5 text-primary" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="flex-1 p-3 rounded-lg gradient-border"
      >
        <div className="text-xs text-primary mb-1">After</div>
        <div className="h-2 w-full bg-primary/30 rounded mb-1" />
        <div className="h-2 w-4/5 bg-primary/30 rounded" />
      </motion.div>
    </div>
  );
}

export function FeaturesSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const visualComponents: Record<string, React.ReactNode> = {
    score: <ScoreVisual />,
    gaps: <GapsVisual />,
    readme: <ReadmeVisual />,
  };

  return (
    <section id="features" className="py-24 sm:py-32 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
      
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
            Everything You Need to{" "}
            <span className="gradient-text">Stand Out</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From analysis to action—we give you the complete toolkit to make your GitHub 
            profile irresistible to recruiters.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="group glass rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_40px_hsl(187_94%_44%/0.15)]"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-primary" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Visual */}
                {visualComponents[feature.visual]}

                {/* Stat */}
                <div className="pt-4 border-t border-border/50">
                  <span className="text-sm font-medium text-primary">
                    {feature.stat}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}