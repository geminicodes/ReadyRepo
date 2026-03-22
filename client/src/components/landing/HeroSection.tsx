import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Easing } from "framer-motion";

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as Easing },
    },
  };

  const floatingScores = [
    { score: 95, label: "Technical Match", delay: 0.8, position: "top-20 right-[10%]" },
    { score: 87, label: "Experience Fit", delay: 1.0, position: "top-40 right-[5%]" },
    { score: 92, label: "Project Relevance", delay: 1.2, position: "bottom-32 right-[15%]" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 animated-grid opacity-30" />
      
      {/* Gradient Mesh Overlay */}
      <div className="absolute inset-0 bg-gradient-mesh" />
      
      {/* Radial Gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Powered by Google Gemini AI
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={itemVariants}
              className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6"
            >
              Turn Your GitHub Into Your{" "}
              <span className="gradient-text">Job Application</span>{" "}
              Secret Weapon
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={itemVariants}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-8"
            >
              AI-powered analysis that scores your repos against any job posting and generates 
              professional READMEs in minutes. Built with Google Gemini.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link to="/analyze">
                <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                  Analyze Your Profile – Free
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <button
                onClick={() => document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                  <Play className="w-5 h-5" />
                  See How It Works
                </Button>
              </button>
            </motion.div>

            {/* Stats Bar */}
            <motion.div 
              variants={itemVariants}
              className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>50+ developers optimized</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <span>2.5 hours saved per application</span>
              </div>
            </motion.div>

            {/* Tech Badges */}
            <motion.div 
              variants={itemVariants}
              className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start"
            >
              <div className="px-3 py-1.5 rounded-md bg-muted/50 border border-border text-xs font-mono text-muted-foreground">
                Google Gemini
              </div>
              <div className="px-3 py-1.5 rounded-md bg-muted/50 border border-border text-xs font-mono text-muted-foreground">
                Cloud Natural Language API
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual - Terminal/Code Editor */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            {/* Terminal Window */}
            <div className="relative glass rounded-2xl p-1 shadow-2xl">
              <div className="bg-card rounded-xl overflow-hidden">
                {/* Terminal Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="ml-4 text-xs font-mono text-muted-foreground">
                    readme-generator.ts
                  </span>
                </div>
                
                {/* Terminal Content */}
                <div className="p-6 font-mono text-sm space-y-4 min-h-[300px]">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">$</span>
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: "auto" }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      <span className="text-muted-foreground">readyrepo analyze</span>
                      <span className="text-foreground"> --github=johndoe</span>
                    </motion.span>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="w-4 h-4" />
                      <span>Analyzing repositories...</span>
                    </div>
                    <div className="text-muted-foreground">
                      ✓ Found 12 public repos
                    </div>
                    <div className="text-muted-foreground">
                      ✓ Detected: React, TypeScript, Node.js
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.8 }}
                    className="mt-4 p-4 rounded-lg bg-muted/30 border border-primary/30"
                  >
                    <div className="text-primary font-semibold mb-2">
                      ✨ README Generated
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Tone: Professional-Startup hybrid
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Match score: 94% for "Senior React Developer"
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Floating Score Cards */}
            {floatingScores.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: item.delay, duration: 0.5 }}
                className={`absolute ${item.position} glass rounded-xl p-3 shadow-lg animate-float`}
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                <div className="text-2xl font-bold gradient-text">{item.score}%</div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{item.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}