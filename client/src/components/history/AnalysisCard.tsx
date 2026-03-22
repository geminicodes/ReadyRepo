import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Briefcase, Github, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HistoryAnalysis } from '@/types/history';

interface AnalysisCardProps {
  analysis: HistoryAnalysis;
  index: number;
}

export function AnalysisCard({ analysis, index }: AnalysisCardProps) {
  const scoreColor = getScoreColor(analysis.overallScore);
  const scoreLabel = getScoreLabel(analysis.overallScore);
  const avatarFallback = (analysis.githubUsername || "?").slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-xl p-5 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        {/* Score Circle */}
        <div className="relative flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={scoreColor}
              strokeWidth="6"
              strokeDasharray={`${(analysis.overallScore / 100) * 176} 176`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-foreground">{analysis.overallScore}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}
            >
              {scoreLabel}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(analysis.analyzedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <h3 className="font-semibold text-foreground truncate">
            {analysis.jobTitle}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <Briefcase className="w-3 h-3" />
            {analysis.jobCompany}
          </p>

          {/* Score Breakdown Mini Bars */}
          <div className="flex gap-4 mt-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Technical</span>
                    <span className="text-foreground">{analysis.technicalScore}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${analysis.technicalScore}%`,
                        backgroundColor: getScoreColor(analysis.technicalScore),
                      }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Technical Skills Match</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="text-foreground">{analysis.experienceScore}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${analysis.experienceScore}%`,
                        backgroundColor: getScoreColor(analysis.experienceScore),
                      }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Experience Alignment</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Relevance</span>
                    <span className="text-foreground">{analysis.relevanceScore}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${analysis.relevanceScore}%`,
                        backgroundColor: getScoreColor(analysis.relevanceScore),
                      }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Project Relevance</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right side - User & Action */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={analysis.githubAvatar} alt={analysis.githubUsername || "GitHub avatar"} />
              <AvatarFallback className="text-[10px] font-medium">{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                <Github className="w-3 h-3" />
                {analysis.githubUsername}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {analysis.repoCount} repos
              </p>
            </div>
          </div>
          <Link to={`/results/${analysis.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary hover:bg-primary/10 group-hover:translate-x-1 transition-transform"
            >
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function AnalysisCardSkeleton() {
  return (
    <div className="glass rounded-xl p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-muted" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-5 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="flex gap-4">
            <div className="flex-1 h-3 bg-muted rounded" />
            <div className="flex-1 h-3 bg-muted rounded" />
            <div className="flex-1 h-3 bg-muted rounded" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="h-8 w-24 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'hsl(142 76% 46%)';
  if (score >= 50) return 'hsl(45 93% 47%)';
  return 'hsl(0 84% 60%)';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Great';
  if (score >= 50) return 'Good';
  return 'Needs Work';
}
