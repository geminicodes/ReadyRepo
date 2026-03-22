import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Lightbulb, ChevronDown, Clock, Zap } from 'lucide-react';
import { Strength, Gap, Recommendation } from '@/types/analysis';

interface InsightsPanelProps {
  strengths: Strength[];
  gaps: Gap[];
  recommendations: Recommendation[];
}

const impactColors = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const priorityColors = {
  high: 'bg-primary/20 text-primary border-primary/30',
  medium: 'bg-secondary/20 text-secondary border-secondary/30',
  low: 'bg-muted text-muted-foreground border-border',
};

export function InsightsPanel({ strengths, gaps, recommendations }: InsightsPanelProps) {
  const [expandedRec, setExpandedRec] = useState<number | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Strengths Column */}
      <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="font-display text-xl font-semibold">Your Strengths</h3>
        </div>

        <div className="space-y-4">
          {strengths.map((strength, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 hover:border-green-500/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground mb-1">{strength.point}</p>
                  <p className="text-sm text-muted-foreground">{strength.evidence}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Gaps Column */}
      <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <h3 className="font-display text-xl font-semibold">Areas to Improve</h3>
        </div>

        <div className="space-y-4">
          {gaps.map((gap, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-foreground">{gap.gap}</p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${impactColors[gap.impact]}`}>
                      {gap.impact.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{gap.suggestion}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recommendations Column */}
      <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold">Action Steps</h3>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-colors overflow-hidden"
            >
              <button
                onClick={() => setExpandedRec(expandedRec === index ? null : index)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-medium text-foreground text-sm">{rec.action}</p>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform ${
                          expandedRec === index ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${priorityColors[rec.priority]}`}>
                        <Zap className="w-3 h-3 inline mr-1" />
                        {rec.priority}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {rec.timeEstimate}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expandedRec === index && rec.details && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0">
                      <p className="text-sm text-muted-foreground pl-9">{rec.details}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}