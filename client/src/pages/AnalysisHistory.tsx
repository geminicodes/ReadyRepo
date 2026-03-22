import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisCard, AnalysisCardSkeleton } from '@/components/history/AnalysisCard';
import { ScoreTrendChart } from '@/components/history/ScoreTrendChart';
import { DateRangeFilter, DateRangePreset, getDateRangeFilter } from '@/components/shared/DateRangeFilter';
import { ScoreRangeFilter } from '@/components/shared/ScoreRangeFilter';
import { SortSelect, SortOption } from '@/components/shared/SortSelect';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProUpgradeBanner } from '@/components/shared/ProUpgradeBanner';
import { fetchAnalysisHistoryPage } from '@/services/historyService';
import { HistoryAnalysis } from '@/types/history';
import { toast } from '@/hooks/use-toast';

export default function AnalysisHistory() {
  const [analyses, setAnalyses] = useState<HistoryAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState<DateRangePreset>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>();
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await fetchAnalysisHistoryPage({ limit: 10, cursor: null });
      setAnalyses(page.items);
      setCursor(page.nextCursor);
    } catch (err) {
      setError('Failed to load analysis history');
      toast({
        title: 'Error',
        description: 'Failed to load analysis history. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (!cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await fetchAnalysisHistoryPage({ limit: 10, cursor });
      setAnalyses((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        const next = [...prev];
        for (const item of page.items) {
          if (!seen.has(item.id)) next.push(item);
        }
        return next;
      });
      setCursor(page.nextCursor);
    } catch {
      toast({
        title: 'Error',
        description: 'Couldn’t load more history. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filteredAndSortedAnalyses = useMemo(() => {
    let result = [...analyses];

    // Date filter
    const dateFilter = getDateRangeFilter(dateRange, customDateRange);
    if (dateFilter) {
      result = result.filter((a) => {
        const date = new Date(a.analyzedAt);
        return date >= dateFilter.from && date <= dateFilter.to;
      });
    }

    // Score filter
    result = result.filter(
      (a) => a.overallScore >= scoreRange[0] && a.overallScore <= scoreRange[1]
    );

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime());
        break;
      case 'highest':
        result.sort((a, b) => b.overallScore - a.overallScore);
        break;
      case 'lowest':
        result.sort((a, b) => a.overallScore - b.overallScore);
        break;
    }

    return result;
  }, [analyses, dateRange, customDateRange, scoreRange, sortBy]);

  const handleExportCSV = () => {
    toast({
      title: 'Pro Feature',
      description: 'Export to CSV is a Pro feature. Upgrade to unlock!',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 animated-grid opacity-30" />
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-3">
                  <History className="w-8 h-8 text-primary" />
                  Analysis History
                </h1>
                <p className="text-muted-foreground mt-2">
                  Track your progress over time
                </p>
              </div>

              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExportCSV}
              >
                <Download className="w-4 h-4" />
                Export CSV
                <span className="text-xs px-1.5 py-0.5 rounded bg-secondary/20 text-secondary ml-1">
                  Pro
                </span>
              </Button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-3 mb-6"
          >
            <DateRangeFilter
              value={dateRange}
              customRange={customDateRange}
              onChange={(preset, custom) => {
                setDateRange(preset);
                setCustomDateRange(custom);
              }}
            />
            <ScoreRangeFilter value={scoreRange} onChange={setScoreRange} />
            <SortSelect value={sortBy} onChange={setSortBy} />
          </motion.div>

          {/* Score Trend Chart */}
          {!isLoading && analyses.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <ScoreTrendChart analyses={analyses} />
            </motion.div>
          )}

          {/* Analysis List */}
          <div className="space-y-4">
            {isLoading ? (
              // Skeleton loaders
              Array.from({ length: 5 }).map((_, i) => (
                <AnalysisCardSkeleton key={i} />
              ))
            ) : error ? (
              // Error state
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={loadAnalyses}>Try Again</Button>
              </div>
            ) : filteredAndSortedAnalyses.length === 0 ? (
              // Empty state
              analyses.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No analyses yet"
                  description="Start analyzing your GitHub profile to see your history here."
                  actionLabel="Analyze Now"
                  actionHref="/analyze"
                />
              ) : (
                <div className="glass rounded-xl p-8 text-center">
                  <p className="text-muted-foreground">No analyses match your filters.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setDateRange('all');
                      setScoreRange([0, 100]);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )
            ) : (
              // Analysis cards
              <>
                {filteredAndSortedAnalyses.map((analysis, index) => (
                  <AnalysisCard key={analysis.id} analysis={analysis} index={index} />
                ))}
                {cursor ? (
                  <div className="pt-2 flex justify-center">
                    <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
                      {isLoadingMore ? "Loading..." : "Load more"}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Pro Upsell */}
          {!isLoading && analyses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <ProUpgradeBanner
                feature="Advanced Filters"
                description="Filter by job type, company, and get detailed trend analysis."
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
