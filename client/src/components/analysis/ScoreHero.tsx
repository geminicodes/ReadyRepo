import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import confetti from 'canvas-confetti';
import { Github, Briefcase, Calendar, Award } from 'lucide-react';

interface ScoreHeroProps {
  score: number;
  githubUsername: string;
  githubAvatar: string;
  jobTitle: string;
  jobCompany: string;
  analyzedAt: string;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return { gradient: 'from-green-400 to-emerald-500', text: 'text-green-400', glow: 'shadow-[0_0_60px_hsl(142_76%_40%/0.4)]' };
  if (score >= 75) return { gradient: 'from-emerald-400 to-green-500', text: 'text-emerald-400', glow: 'shadow-[0_0_40px_hsl(152_76%_40%/0.3)]' };
  if (score >= 50) return { gradient: 'from-yellow-400 to-orange-500', text: 'text-yellow-400', glow: 'shadow-[0_0_40px_hsl(45_93%_50%/0.3)]' };
  return { gradient: 'from-red-400 to-rose-500', text: 'text-red-400', glow: 'shadow-[0_0_40px_hsl(0_76%_50%/0.3)]' };
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return { label: 'Excellent Match!', icon: Award };
  if (score >= 75) return { label: 'Great Match', icon: Award };
  if (score >= 50) return { label: 'Good Match', icon: Award };
  return { label: 'Needs Improvement', icon: Award };
};

export function ScoreHero({
  score,
  githubUsername,
  githubAvatar,
  jobTitle,
  jobCompany,
  analyzedAt,
}: ScoreHeroProps) {
  const confettiTriggered = useRef(false);
  const scoreColors = getScoreColor(score);
  const scoreInfo = getScoreLabel(score);

  useEffect(() => {
    if (score >= 85 && !confettiTriggered.current) {
      confettiTriggered.current = true;
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#ec4899', '#22c55e'],
        });
      }, 2500);
    }
  }, [score]);

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center py-12"
    >
      {/* Score Circle */}
      <div className={`relative w-72 h-72 mx-auto mb-8 rounded-full ${scoreColors.glow}`}>
        {/* Background Circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="16"
          />
          <motion.circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(187 94% 44%)" />
              <stop offset="100%" stopColor="hsl(330 81% 60%)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
          >
            <span className={`text-7xl font-display font-bold ${scoreColors.text}`}>
              <CountUp end={score} duration={2} delay={0.5} />
            </span>
            <span className={`text-4xl font-display ${scoreColors.text}`}>%</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-lg font-medium text-muted-foreground mt-2"
          >
            {scoreInfo.label}
          </motion.p>
        </div>
      </div>

      {/* Metadata Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex flex-wrap justify-center gap-4"
      >
        {/* GitHub Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Github className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium">{githubUsername}</span>
        </div>

        {/* Job Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
          <Briefcase className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium">{jobTitle}</span>
          {jobCompany && (
            <span className="text-sm text-muted-foreground">at {jobCompany}</span>
          )}
        </div>

        {/* Date Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Analyzed on {new Date(analyzedAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}