import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Github, Briefcase, Brain, BarChart3, Lightbulb, CheckCircle, Sparkles } from "lucide-react";

const loadingSteps = [
  { icon: Github, message: "Fetching your repositories...", color: "text-primary" },
  { icon: Briefcase, message: "Analyzing job requirements...", color: "text-secondary" },
  { icon: Brain, message: "Detecting company tone...", color: "text-primary" },
  { icon: BarChart3, message: "Scoring your profile...", color: "text-secondary" },
  { icon: Lightbulb, message: "Generating recommendations...", color: "text-primary" },
  { icon: CheckCircle, message: "Almost done...", color: "text-green-500" },
];

const sampleRepos = [
  "react-dashboard",
  "ecommerce-app",
  "weather-widget",
  "portfolio-v2",
  "api-toolkit",
  "design-system",
  "chat-application",
  "task-manager",
];

export function AnalysisLoading() {
  const [currentStep, setCurrentStep] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [reducedMotion]);

  const CurrentIcon = loadingSteps[currentStep].icon;

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0 }}
      animate={reducedMotion ? undefined : { opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
    >
      {/* Background animated repos */}
      {!reducedMotion ? (
        <div className="absolute inset-0 overflow-hidden opacity-10 blur-sm">
          <div className="absolute inset-0 flex flex-col gap-4 animate-scroll">
            {[...sampleRepos, ...sampleRepos, ...sampleRepos].map((repo, index) => (
              <motion.div
                key={index}
                initial={{ x: index % 2 === 0 ? -100 : 100, opacity: 0 }}
                animate={{ x: 0, opacity: 0.5 }}
                transition={{ delay: index * 0.1 }}
                className={`text-2xl font-mono whitespace-nowrap ${index % 2 === 0 ? 'ml-20' : 'ml-40'}`}
              >
                📁 {repo}
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Main loading card */}
      <motion.div
        initial={reducedMotion ? undefined : { scale: 0.9, opacity: 0 }}
        animate={reducedMotion ? undefined : { scale: 1, opacity: 1 }}
        className="relative glass rounded-3xl p-10 max-w-md mx-4 text-center animate-pulse-glow"
      >
        {/* Sparkles decoration */}
        {!reducedMotion ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -top-4 -right-4"
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>
        ) : (
          <div className="absolute -top-4 -right-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        )}

        {/* Animated spinner */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer ring */}
          <motion.div
            animate={reducedMotion ? undefined : { rotate: 360 }}
            transition={reducedMotion ? undefined : { duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
          />
          
          {/* Inner ring */}
          <motion.div
            animate={reducedMotion ? undefined : { rotate: -360 }}
            transition={reducedMotion ? undefined : { duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border-4 border-secondary/20 border-b-secondary"
          />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentIcon className={`w-8 h-8 ${loadingSteps[currentStep].color}`} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Loading message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-lg font-medium text-foreground mb-4"
          >
            {loadingSteps[currentStep].message}
          </motion.p>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {loadingSteps.map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "bg-primary w-6"
                  : index < currentStep
                  ? "bg-primary/60"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Helper text */}
        <p className="text-sm text-muted-foreground mt-6">
          This usually takes 15-30 seconds
        </p>
      </motion.div>
    </motion.div>
  );
}