import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, History, FileText, Calendar, Briefcase, Github, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { READMECard } from "@/components/history/READMECard";
import { READMEViewModal } from "@/components/history/READMEViewModal";
import { mockHistoryData, mockREADMEData } from "@/types/history";
import type { HistoryAnalysis, SavedREADME } from "@/types/history";

function getScoreColor(score: number): string {
  if (score >= 75) return "hsl(142 76% 46%)";
  if (score >= 50) return "hsl(45 93% 47%)";
  return "hsl(0 84% 60%)";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Great";
  if (score >= 50) return "Good";
  return "Needs Work";
}

function DemoAnalysisCard({ analysis, index }: { analysis: HistoryAnalysis; index: number }) {
  const scoreColor = getScoreColor(analysis.overallScore);
  const scoreLabel = getScoreLabel(analysis.overallScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-xl p-4 hover:shadow-lg hover:shadow-primary/10 transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Score */}
        <div className="relative flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
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
            <span className="text-base font-bold text-foreground">{analysis.overallScore}</span>
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
              {new Date(analysis.analyzedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <h3 className="font-semibold text-foreground truncate">{analysis.jobTitle}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
            <Briefcase className="w-3 h-3" />
            {analysis.jobCompany}
          </p>

          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              { label: "Tech", value: analysis.technicalScore },
              { label: "Exp", value: analysis.experienceScore },
              { label: "Rel", value: analysis.relevanceScore },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="text-foreground">{s.value}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.value}%`, backgroundColor: getScoreColor(s.value) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <img
              src={analysis.githubAvatar}
              alt={analysis.githubUsername}
              className="w-8 h-8 rounded-full border border-border"
            />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground flex items-center justify-end gap-1">
                <Github className="w-3 h-3" />
                {analysis.githubUsername}
              </p>
              <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                <Layers className="w-3 h-3" />
                {analysis.repoCount} repos
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled className="opacity-70">
            Demo Data
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Demo() {
  const demoAnalyses = useMemo(() => mockHistoryData.slice(0, 4), []);
  const demoReadmes = useMemo(() => mockREADMEData.slice(0, 6), []);

  const [selectedReadme, setSelectedReadme] = useState<SavedREADME | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 animated-grid opacity-30" />
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  Product Demo
                </h1>
                <p className="text-muted-foreground mt-2">
                  Preview the History + READMEs experience with sample data.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link to="/analyze">
                  <Button variant="hero">Try it with your GitHub</Button>
                </Link>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* History panel */}
            <section className="glass rounded-2xl p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-xl font-semibold">History</h2>
                </div>
                <span className="text-xs text-muted-foreground">Sample</span>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-auto pr-1">
                {demoAnalyses.map((analysis, i) => (
                  <DemoAnalysisCard key={analysis.id} analysis={analysis} index={i} />
                ))}
              </div>
            </section>

            {/* READMEs panel */}
            <section className="glass rounded-2xl p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-xl font-semibold">READMEs</h2>
                </div>
                <span className="text-xs text-muted-foreground">Sample</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[calc(100vh-320px)] overflow-auto pr-1">
                {demoReadmes.map((readme, i) => (
                  <READMECard
                    key={readme.id}
                    readme={readme}
                    index={i}
                    onViewFull={(r) => {
                      setSelectedReadme(r);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <READMEViewModal
        readme={selectedReadme}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReadme(null);
        }}
      />
    </div>
  );
}

