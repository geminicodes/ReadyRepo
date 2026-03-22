import { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Download, Edit3, Eye, Lock, Calendar, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SavedREADME, toneColors, toneLabels } from '@/types/history';
import { toast } from '@/hooks/use-toast';

interface READMECardProps {
  readme: SavedREADME;
  index: number;
  onViewFull: (readme: SavedREADME) => void;
}

export function READMECard({ readme, index, onViewFull }: READMECardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = new Blob([readme.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${readme.repoName}-README.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Downloaded!',
        description: `${readme.repoName}-README.md saved successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Could not download the README file.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const previewLines = readme.markdown.split('\n').slice(0, 4).join('\n');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-xl overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <a
              href={readme.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Github className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold truncate">{readme.repoName}</span>
            </a>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
              <Briefcase className="w-3 h-3 flex-shrink-0" />
              {readme.jobContext}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium border flex-shrink-0 ${
              toneColors[readme.tone]
            }`}
          >
            {toneLabels[readme.tone]}
          </span>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 flex-1">
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed">
          {previewLines}
        </pre>
      </div>

      {/* Footer */}
      <div className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(readme.generatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => onViewFull(readme)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Full README</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download .md</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Lock className="w-3 h-3 absolute -top-0.5 -right-0.5" />
                  <Edit3 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit (Pro feature)</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function READMECardSkeleton() {
  return (
    <div className="glass rounded-xl overflow-hidden animate-pulse">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted rounded" />
          </div>
          <div className="h-6 w-16 bg-muted rounded-full" />
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-3/4 bg-muted rounded" />
        <div className="h-3 w-5/6 bg-muted rounded" />
        <div className="h-3 w-2/3 bg-muted rounded" />
      </div>
      <div className="p-4 pt-0 flex justify-between">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="flex gap-1">
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
