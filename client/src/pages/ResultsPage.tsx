import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from "react-router-dom";
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScoreHero } from '@/components/analysis/ScoreHero';
import { ScoreBreakdown } from '@/components/analysis/ScoreBreakdown';
import { InsightsPanel } from '@/components/analysis/InsightsPanel';
import { RepoGrid } from '@/components/analysis/RepoGrid';
import { FeedbackCTA } from '@/components/analysis/FeedbackCTA';
import { FeedbackModal } from '@/components/analysis/FeedbackModal';
import { toast } from '@/hooks/use-toast';
import { useAnalysis } from "@/context/AnalysisContext";
import { authFetch } from "@/services/authFetch";
import { mapStoredAnalysisDocToClient } from "@/services/analysisMapper";

const ResultsPage = () => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { analysisId } = useParams<{ analysisId: string }>();
  
  const { analysisResult: result, setAnalysisResult } = useAnalysis();

  const needsFetch = useMemo(() => {
    if (!analysisId) return false;
    if (analysisId.startsWith("local-")) return false;
    return !result || result.id !== analysisId;
  }, [analysisId, result]);

  useEffect(() => {
    if (!needsFetch || !analysisId) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const base = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/+$/, "");
        const res = await authFetch(`${base}/history/analysis/${encodeURIComponent(analysisId)}`);
        const json = (await res.json().catch(() => null)) as unknown;
        if (!res.ok) {
          if (res.status === 404) throw new Error("Analysis not found.");
          if (res.status === 401) throw new Error("Your session expired. Please sign in again.");
          throw new Error("Failed to load analysis.");
        }

        const data =
          json && typeof json === "object" && !Array.isArray(json)
            ? (json as Record<string, unknown>)["data"]
            : null;
        const analysisRaw =
          data && typeof data === "object" && !Array.isArray(data)
            ? (data as Record<string, unknown>)["analysis"]
            : null;

        const mapped = mapStoredAnalysisDocToClient(analysisRaw);
        if (!mapped) throw new Error("Invalid analysis response.");

        if (!cancelled) setAnalysisResult(mapped);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load analysis.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [analysisId, needsFetch, setAnalysisResult]);

  if (!result && (loading || loadError)) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="glass rounded-2xl p-8 text-center">
            {loading ? (
              <>
                <h1 className="font-display text-2xl font-bold mb-2">Loading analysis…</h1>
                <p className="text-muted-foreground">Fetching your saved result.</p>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold mb-2">Couldn’t load analysis</h1>
                <p className="text-muted-foreground mb-6">{loadError}</p>
                <Link to="/history">
                  <Button variant="outline">Back to history</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="glass rounded-2xl p-8 text-center">
            <h1 className="font-display text-2xl font-bold mb-2">No analysis loaded</h1>
            <p className="text-muted-foreground mb-6">
              Run a new analysis to see results.
            </p>
            <Link to="/analyze">
              <Button variant="hero">Start an analysis</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Share this link to show your analysis results.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: "Export coming soon!",
      description: "PDF export will be available in the Pro version.",
    });
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Effects */}
      <div className="fixed inset-0 animated-grid opacity-10 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/analyze" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">New Analysis</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Score Hero Section */}
        <section className="mb-12">
          <ScoreHero
            score={result.overallScore}
            githubUsername={result.githubUsername}
            githubAvatar={result.githubAvatar}
            jobTitle={result.jobTitle}
            jobCompany={result.jobCompany}
            analyzedAt={result.analyzedAt}
          />
        </section>

        {/* Score Breakdown */}
        <section className="mb-16">
          <ScoreBreakdown breakdown={result.breakdown} />
        </section>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-16"
        />

        {/* Insights Panel */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">
              Your Profile Insights
            </h2>
            <p className="text-muted-foreground">
              What the AI found about your GitHub profile
            </p>
          </motion.div>
          
          <InsightsPanel
            strengths={result.strengths}
            gaps={result.gaps}
            recommendations={result.recommendations}
          />
        </section>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-16"
        />

        {/* Repository Analysis */}
        <section className="mb-16">
          <RepoGrid repositories={result.repositories} />
        </section>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-16"
        />

        {/* Feedback CTA */}
        <section className="mb-16">
          <FeedbackCTA onFeedbackClick={() => setIsFeedbackOpen(true)} />
        </section>
      </main>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
};

export default ResultsPage;