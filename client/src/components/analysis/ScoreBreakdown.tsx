import { motion } from 'framer-motion';
import { Code, Briefcase, Target, Info } from 'lucide-react';
import { ScoreBreakdown as ScoreBreakdownType } from '@/types/analysis';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType;
}

const breakdownItems = [
  {
    key: 'technicalSkills',
    label: 'Technical Skills',
    icon: Code,
    tooltip: 'How well your tech stack matches the job requirements',
  },
  {
    key: 'experienceAlignment',
    label: 'Experience',
    icon: Briefcase,
    tooltip: 'Does your project complexity match the seniority level?',
  },
  {
    key: 'projectRelevance',
    label: 'Relevance',
    icon: Target,
    tooltip: 'Are your projects similar to what the job entails?',
  },
] as const;

const getScoreColor = (score: number) => {
  if (score >= 80) return 'from-green-400 to-emerald-500';
  if (score >= 60) return 'from-yellow-400 to-orange-500';
  return 'from-red-400 to-rose-500';
};

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto"
    >
      {breakdownItems.map((item, index) => {
        const score = breakdown[item.key];
        const Icon = item.icon;
        const gradientColor = getScoreColor(score);

        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
            className="glass rounded-xl p-6 hover:scale-105 transition-all duration-300 group"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Score */}
            <div className="text-3xl font-display font-bold gradient-text mb-3">
              {score}
              <span className="text-lg text-muted-foreground">/100</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, delay: 0.6 + index * 0.1, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${gradientColor}`}
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}