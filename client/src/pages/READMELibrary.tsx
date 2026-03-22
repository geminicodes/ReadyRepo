import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { READMECard, READMECardSkeleton } from '@/components/history/READMECard';
import { READMEViewModal } from '@/components/history/READMEViewModal';
import { DateRangeFilter, DateRangePreset, getDateRangeFilter } from '@/components/shared/DateRangeFilter';
import { ToneFilter } from '@/components/shared/ToneFilter';
import { SortSelect, SortOption } from '@/components/shared/SortSelect';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProUpgradeBanner } from '@/components/shared/ProUpgradeBanner';
import { fetchUserREADMEsPage } from '@/services/historyService';
import { SavedREADME } from '@/types/history';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

export default function READMELibrary() {
  const [readmes, setReadmes] = useState<SavedREADME[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReadme, setSelectedReadme] = useState<SavedREADME | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [dateRange, setDateRange] = useState<DateRangePreset>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>();
  const [toneFilter, setToneFilter] = useState<Array<'startup' | 'corporate' | 'formal' | 'casual' | 'innovative'>>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    loadReadmes();
  }, []);

  const loadReadmes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await fetchUserREADMEsPage({ limit: 12, cursor: null });
      setReadmes(page.items);
      setCursor(page.nextCursor);
    } catch (err) {
      setError('Failed to load README library');
      toast({
        title: 'Error',
        description: 'Failed to load README library. Please try again.',
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
      const page = await fetchUserREADMEsPage({ limit: 12, cursor });
      setReadmes((prev) => {
        const seen = new Set(prev.map((r) => r.id));
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
        description: 'Couldn’t load more READMEs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filteredAndSortedReadmes = useMemo(() => {
    let result = [...readmes];

    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.repoName.toLowerCase().includes(query) ||
          r.jobContext.toLowerCase().includes(query)
      );
    }

    // Date filter
    const dateFilter = getDateRangeFilter(dateRange, customDateRange);
    if (dateFilter) {
      result = result.filter((r) => {
        const date = new Date(r.generatedAt);
        return date >= dateFilter.from && date <= dateFilter.to;
      });
    }

    // Tone filter
    if (toneFilter.length > 0) {
      result = result.filter((r) => toneFilter.includes(r.tone));
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime());
        break;
      case 'name-asc':
        result.sort((a, b) => a.repoName.localeCompare(b.repoName));
        break;
      case 'name-desc':
        result.sort((a, b) => b.repoName.localeCompare(a.repoName));
        break;
    }

    return result;
  }, [readmes, debouncedSearch, dateRange, customDateRange, toneFilter, sortBy]);

  const handleViewFull = (readme: SavedREADME) => {
    setSelectedReadme(readme);
    setIsModalOpen(true);
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 animated-grid opacity-30" />
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
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

            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              README Library
            </h1>
            <p className="text-muted-foreground mt-2">
              Your AI-generated READMEs, ready to use
            </p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 space-y-4"
          >
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by repo name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <ToneFilter value={toneFilter} onChange={setToneFilter} />
              <DateRangeFilter
                value={dateRange}
                customRange={customDateRange}
                onChange={(preset, custom) => {
                  setDateRange(preset);
                  setCustomDateRange(custom);
                }}
              />
              <SortSelect value={sortBy} onChange={setSortBy} options={sortOptions} />
            </div>
          </motion.div>

          {/* Pro Upsell Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <ProUpgradeBanner
              feature="Edit READMEs"
              description="Edit and customize your generated READMEs before using them."
            />
          </motion.div>

          {/* README Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <READMECardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={loadReadmes}
                className="text-primary hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : filteredAndSortedReadmes.length === 0 ? (
            readmes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No READMEs yet"
                description="Generate professional READMEs by analyzing your GitHub profile."
                actionLabel="Get Started"
                actionHref="/analyze"
              />
            ) : (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-muted-foreground">No READMEs match your filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDateRange('all');
                    setToneFilter([]);
                  }}
                  className="text-primary hover:underline mt-4 inline-block"
                >
                  Clear Filters
                </button>
              </div>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredAndSortedReadmes.map((readme, index) => (
                <READMECard
                  key={readme.id}
                  readme={readme}
                  index={index}
                  onViewFull={handleViewFull}
                />
              ))}
            </motion.div>
          )}

          {!isLoading && !error && filteredAndSortedReadmes.length > 0 && cursor ? (
            <div className="pt-6 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="text-primary hover:underline disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* View Modal */}
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
