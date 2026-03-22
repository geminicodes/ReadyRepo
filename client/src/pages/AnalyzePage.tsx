import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Github, Link as LinkIcon, Sparkles, Shield, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisLoading } from '@/components/analysis/AnalysisLoading';
import { toast } from '@/hooks/use-toast';
import { RateLimitBanner } from '@/components/shared/RateLimitBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useRateLimit, emitUsageUpdate } from '@/hooks/use-rate-limit';
import { setAnalysisUsage } from '@/lib/rateLimit';
import { trackEvent } from '@/config/firebase';
import { useAnalysis } from '@/context/AnalysisContext';
import { useDelayedFlag } from "@/hooks/use-delayed-flag";

const AnalyzePage = () => {
  const navigate = useNavigate();
  const { user, tier } = useAuth();
  const { snapshot } = useRateLimit();
  const { startAnalysis, setLastJob } = useAnalysis();
  const [username, setUsername] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; jobUrl?: string; jobTitle?: string; description?: string }>({});
  const showLoadingOverlay = useDelayedFlag(isLoading, 250);

  const validateForm = () => {
    const newErrors: { username?: string; jobUrl?: string; jobTitle?: string; description?: string } = {};
    
    // Username validation: alphanumeric + hyphens only
    if (!username.trim()) {
      newErrors.username = 'GitHub username is required';
    } else if (!/^[a-zA-Z0-9-]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and hyphens';
    }
    
    // URL validation
    if (!jobUrl.trim()) {
      newErrors.jobUrl = 'Job URL is required';
    } else {
      try {
        new URL(jobUrl);
      } catch {
        newErrors.jobUrl = 'Please enter a valid URL';
      }
    }

    if (!jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (!description.trim() || description.trim().length < 50) {
      newErrors.description = 'Job description is required (50+ characters)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (tier === "free" && (snapshot.remaining ?? 0) <= 0) {
      toast({
        title: "Monthly limit reached",
        description: "Upgrade to Pro for unlimited analyses.",
        variant: "destructive",
      });
      navigate("/upgrade");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await trackEvent("analysis_started", { uid: user?.uid ?? "anon", tier });

      // Persist job details for the API call performed by AnalysisContext.
      setLastJob({ jobUrl, jobTitle, description });

      const analysisId = await startAnalysis(username.trim(), jobUrl.trim());
      navigate(`/results/${encodeURIComponent(analysisId)}`);
    } catch (error) {
      // If server tells us we're rate-limited, sync local banner/disable logic.
      const message = error instanceof Error ? error.message : "";
      if (tier === "free" && user?.uid && /monthly limit reached/i.test(message)) {
        setAnalysisUsage(user.uid, 3);
        emitUsageUpdate();
      }
      toast({
        title: "Analysis Failed",
        description: message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      if (/monthly limit reached/i.test(message)) navigate("/upgrade");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 animated-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-mesh" />
      
      <AnimatePresence>
        {showLoadingOverlay && <AnalysisLoading />}
      </AnimatePresence>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="max-w-2xl mx-auto mb-6">
          <RateLimitBanner />
        </div>
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to home</span>
          </Link>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                AI-Powered Analysis
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Analyze Your{" "}
              <span className="gradient-text">GitHub Profile</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Get AI-powered insights and job-tailored README improvements in minutes.
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass rounded-2xl p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* GitHub Username */}
              <div className="space-y-2">
                <label htmlFor="github" className="block text-sm font-medium">
                  GitHub Username
                </label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="github"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors({ ...errors, username: undefined });
                    }}
                    placeholder="octocat"
                    className={`w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono transition-all ${
                      errors.username ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {errors.username && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-destructive"
                    >
                      {errors.username}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Job Posting URL */}
              <div className="space-y-2">
                <label htmlFor="job-url" className="block text-sm font-medium">
                  Job Posting URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="job-url"
                    type="url"
                    value={jobUrl}
                    onChange={(e) => {
                      setJobUrl(e.target.value);
                      if (errors.jobUrl) setErrors({ ...errors, jobUrl: undefined });
                    }}
                    placeholder="https://company.com/careers/developer"
                    className={`w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm transition-all ${
                      errors.jobUrl ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Works with LinkedIn, Indeed, company sites in any language
                </p>
                <AnimatePresence>
                  {errors.jobUrl && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-destructive"
                    >
                      {errors.jobUrl}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Job Title */}
              <div className="space-y-2">
                <label htmlFor="job-title" className="block text-sm font-medium">
                  Job Title
                </label>
                <input
                  id="job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    if (errors.jobTitle) setErrors({ ...errors, jobTitle: undefined });
                  }}
                  placeholder="Senior Frontend Engineer"
                  className={`w-full h-12 px-4 rounded-xl bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                    errors.jobTitle ? 'border-destructive' : 'border-border'
                  }`}
                />
                <AnimatePresence>
                  {errors.jobTitle && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-destructive"
                    >
                      {errors.jobTitle}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <label htmlFor="job-description" className="block text-sm font-medium">
                  Job Description
                </label>
                <textarea
                  id="job-description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors({ ...errors, description: undefined });
                  }}
                  placeholder="Paste the full job description here…"
                  rows={8}
                  className={`w-full px-4 py-3 rounded-xl bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm transition-all ${
                    errors.description ? 'border-destructive' : 'border-border'
                  }`}
                />
                <AnimatePresence>
                  {errors.description && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-destructive"
                    >
                      {errors.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Profile
                    <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
                  </>
                )}
              </Button>
            </form>

            {/* Info Section */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>3 free analyses per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Takes 15-30 seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Powered by Google Gemini AI</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzePage;