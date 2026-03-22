import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Download, Check, FileText, Eye, Code, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface READMEModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  currentReadme: string | null;
  onGenerate: () => Promise<string>;
}

const improvements = [
  'Added detailed installation steps',
  'Included tech stack badges',
  'Added usage examples with code',
  'Included contribution guidelines',
  'Added license information',
];

export function READMEModal({ 
  isOpen, 
  onClose, 
  repoName, 
  currentReadme,
  onGenerate 
}: READMEModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown'>('preview');
  const [generatedReadme, setGeneratedReadme] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const readme = await onGenerate();
      setGeneratedReadme(readme);
    } catch {
      setError('Failed to generate README. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, onGenerate]);

  // Generate README on modal open
  useEffect(() => {
    if (!isOpen) return;
    if (generatedReadme) return;
    void handleGenerate();
  }, [generatedReadme, handleGenerate, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Focus first element
      setTimeout(() => firstFocusableRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen, generatedReadme]);

  const handleCopy = useCallback(async () => {
    if (!generatedReadme) return;
    
    try {
      await navigator.clipboard.writeText(generatedReadme);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "README markdown is ready to paste.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try selecting and copying manually.",
        variant: "destructive",
      });
    }
  }, [generatedReadme]);

  const handleDownload = useCallback(() => {
    if (!generatedReadme) return;
    
    const blob = new Blob([generatedReadme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `README-${repoName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: `README-${repoName}.md saved to your downloads.`,
    });
  }, [generatedReadme, repoName]);

  const handleClose = () => {
    setGeneratedReadme(null);
    setError(null);
    setActiveTab('preview');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl max-h-[90vh] glass rounded-2xl border border-border/50 shadow-2xl overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/50">
              <div>
                <h2 id="modal-title" className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  README for {repoName}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  AI-generated README tailored to match job requirements
                </p>
              </div>
              
              <button
                ref={firstFocusableRef}
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary mb-6"
                  />
                  <h3 className="font-display text-xl font-semibold mb-2">Generating Enhanced README</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Our AI is analyzing your repository and creating a professional README tailored to your target job...
                  </p>
                  <div className="mt-6 space-y-2">
                    {['Analyzing repository structure...', 'Extracting key features...', 'Matching job requirements...'].map((step, i) => (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 1.5, duration: 0.5 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Sparkles className="w-4 h-4 text-primary" />
                        {step}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
                  <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-6">
                    <X className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">Generation Failed</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">{error}</p>
                  <Button variant="hero" onClick={handleGenerate}>
                    <Sparkles className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>
              ) : generatedReadme ? (
                <div className="flex flex-col h-full">
                  {/* Improvements Banner */}
                  <div className="px-4 sm:px-6 py-3 bg-primary/5 border-b border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-primary font-medium">✨ Improvements made:</span>
                      <div className="flex flex-wrap gap-2">
                        {improvements.slice(0, 3).map((imp, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                            {imp}
                          </span>
                        ))}
                        {improvements.length > 3 && (
                          <span className="text-muted-foreground text-xs">+{improvements.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-1 px-4 sm:px-6 py-3 border-b border-border/50">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'preview'
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => setActiveTab('markdown')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'markdown'
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <Code className="w-4 h-4" />
                      Markdown
                    </button>
                  </div>

                  {/* Comparison View */}
                  <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
                    {/* Current README */}
                    <div className="flex flex-col min-h-0">
                      <div className="px-4 sm:px-6 py-3 bg-muted/30 border-b border-border/50 flex-shrink-0">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                          Current README
                        </h3>
                      </div>
                      <div className="flex-1 overflow-auto p-4 sm:p-6">
                        {currentReadme ? (
                          <div className="prose prose-sm prose-invert max-w-none opacity-60">
                            <ReactMarkdown
                              components={{
                                code: ({ className, children, ...props }) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const isInline = !match;
                                  return isInline ? (
                                    <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm" {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <pre className="my-3 rounded-lg bg-muted/40 border border-border/60 overflow-auto">
                                      <code className="block p-3 text-sm font-mono">
                                        {String(children).replace(/\n$/, '')}
                                      </code>
                                    </pre>
                                  );
                                },
                              }}
                            >
                              {currentReadme}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                              <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h4 className="font-medium mb-1">No README Found</h4>
                            <p className="text-sm text-muted-foreground max-w-xs">
                              This repository doesn't have a README yet. Check out the generated version on the right!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Generated README */}
                    <div className="flex flex-col min-h-0">
                      <div className="px-4 sm:px-6 py-3 bg-primary/5 border-b border-border/50 flex-shrink-0">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          Generated README
                          <ArrowRight className="w-4 h-4 text-primary ml-auto" />
                        </h3>
                      </div>
                      <div className="flex-1 overflow-auto p-4 sm:p-6">
                        {activeTab === 'preview' ? (
                          <div className="prose prose-sm prose-invert max-w-none">
                            <ReactMarkdown
                              components={{
                                code: ({ className, children, ...props }) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const isInline = !match;
                                  return isInline ? (
                                    <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm" {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <pre className="my-3 rounded-lg bg-muted/40 border border-border/60 overflow-auto">
                                      <code className="block p-3 text-sm font-mono">
                                        {String(children).replace(/\n$/, '')}
                                      </code>
                                    </pre>
                                  );
                                },
                              }}
                            >
                              {generatedReadme}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <pre className="font-mono text-sm whitespace-pre-wrap text-muted-foreground bg-muted/30 rounded-lg p-4 overflow-auto">
                            {generatedReadme}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer Actions */}
            {generatedReadme && !isGenerating && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 border-t border-border/50 bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  <span className="hidden sm:inline">Ready to use! </span>
                  Copy or download your enhanced README.
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    <Sparkles className="w-4 h-4" />
                    Regenerate
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                  
                  <Button
                    variant="hero"
                    onClick={handleCopy}
                    className="min-w-[100px]"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
