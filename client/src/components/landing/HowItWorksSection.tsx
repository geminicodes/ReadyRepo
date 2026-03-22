import { motion } from "framer-motion";
import { Link, Sparkles, CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Link,
    title: "Paste & Submit",
    description: "Drop your GitHub username and the job posting URL. That's it.",
    visual: "input",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "AI Analysis",
    description: "Our AI analyzes your repos, extracts job requirements, and detects company tone using Google Cloud Natural Language API.",
    visual: "analysis",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Get Results & Enhanced READMEs",
    description: "Receive your fit score, detailed recommendations, and professionally generated READMEs ready to copy-paste.",
    visual: "results",
  },
];

function InputVisual() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="p-4 rounded-xl bg-card border border-border space-y-3"
    >
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">GitHub Username</div>
        <div className="h-10 rounded-lg bg-muted/50 border border-border flex items-center px-3">
          <motion.span
            initial={{ width: 0 }}
            whileInView={{ width: "auto" }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-sm font-mono text-foreground overflow-hidden whitespace-nowrap"
          >
            johndoe
          </motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-0.5 h-4 bg-primary ml-0.5"
          />
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Job Posting URL</div>
        <div className="h-10 rounded-lg bg-muted/50 border border-border flex items-center px-3">
          <span className="text-sm font-mono text-muted-foreground truncate">
            linkedin.com/jobs/view/...
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function AnalysisVisual() {
  const analysisSteps = ["Fetching repositories...", "Analyzing code patterns...", "Matching job requirements..."];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="p-4 rounded-xl bg-card border border-border"
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent"
        />
        <span className="text-sm text-primary font-medium">Processing...</span>
      </div>
      <div className="space-y-2">
        {analysisSteps.map((step, index) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + index * 0.2 }}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            {step}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ResultsVisual() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="p-4 rounded-xl gradient-border"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Match Score</span>
        <motion.span
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, type: "spring" }}
          className="text-2xl font-bold gradient-text"
        >
          94%
        </motion.span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Technical Skills</span>
          <span className="text-primary">Excellent</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">README Quality</span>
          <span className="text-green-500">Enhanced ✨</span>
        </div>
      </div>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const visualComponents: Record<string, React.ReactNode> = {
    input: <InputVisual />,
    analysis: <AnalysisVisual />,
    results: <ResultsVisual />,
  };

  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />
      
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
            From GitHub to{" "}
            <span className="gradient-text">Job-Ready</span>{" "}
            in 3 Steps
          </h2>
          <p className="text-lg text-muted-foreground">
            No complex setup. No learning curve. Just results.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Timeline Line - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          {/* Timeline Line - Mobile */}
          <div className="lg:hidden absolute top-0 bottom-0 left-8 w-px bg-gradient-to-b from-primary/30 via-primary/30 to-transparent" />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  {/* Step Number Badge */}
                  <div className="flex items-start gap-6 lg:flex-col lg:items-center lg:text-center">
                    {/* Icon Container */}
                    <div className="relative flex-shrink-0">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_30px_hsl(187_94%_44%/0.3)]"
                      >
                        <Icon className="w-8 h-8 text-primary-foreground" />
                      </motion.div>
                      {/* Step Number */}
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{step.number}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 lg:mt-6">
                      <h3 className="font-display text-xl font-semibold mb-2">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                        {step.description}
                      </p>
                      
                      {/* Visual */}
                      <div className="lg:max-w-xs lg:mx-auto">
                        {visualComponents[step.visual]}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}