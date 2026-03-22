import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { HistoryAnalysis } from '@/types/history';

interface ScoreTrendChartProps {
  analyses: HistoryAnalysis[];
}

type ChartPoint = {
  date: string;
  fullDate: string;
  score: number;
  jobTitle: string;
};

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  const data = (payload?.[0]?.payload ?? null) as ChartPoint | null;
  if (!active || !data) return null;

  return (
    <div className="glass rounded-lg p-3 border border-border">
      <p className="text-sm font-medium text-foreground">{data.fullDate}</p>
      <p className="text-xs text-muted-foreground mt-1">{data.jobTitle}</p>
      <p className="text-lg font-bold mt-2" style={{ color: getScoreColor(data.score) }}>
        Score: {data.score}
      </p>
    </div>
  );
}

export function ScoreTrendChart({ analyses }: ScoreTrendChartProps) {
  const chartData = useMemo(() => {
    return [...analyses]
      .sort((a, b) => new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime())
      .map((analysis) => ({
        date: new Date(analysis.analyzedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        fullDate: new Date(analysis.analyzedAt).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        score: analysis.overallScore,
        jobTitle: analysis.jobTitle,
      }));
  }, [analyses]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return 'neutral';
    const first = chartData[0].score;
    const last = chartData[chartData.length - 1].score;
    if (last > first + 5) return 'up';
    if (last < first - 5) return 'down';
    return 'neutral';
  }, [chartData]);

  const averageScore = useMemo(() => {
    return Math.round(chartData.reduce((acc, d) => acc + d.score, 0) / chartData.length);
  }, [chartData]);

  if (chartData.length < 3) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <p className="text-muted-foreground">
          Complete at least 3 analyses to see your score trend chart.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {3 - chartData.length} more to go!
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Score Trend</h3>
          <p className="text-sm text-muted-foreground">Your performance over time</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{averageScore}</p>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </div>
          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
              trend === 'up'
                ? 'bg-green-500/20 text-green-400'
                : trend === 'down'
                ? 'bg-destructive/20 text-destructive'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-4 h-4" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4" />}
            {trend === 'neutral' && <Minus className="w-4 h-4" />}
            <span>{trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={CustomTooltip} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#scoreGradient)"
              dot={{
                fill: 'hsl(var(--primary))',
                strokeWidth: 2,
                r: 4,
                stroke: 'hsl(var(--background))',
              }}
              activeDot={{
                fill: 'hsl(var(--primary))',
                strokeWidth: 3,
                r: 6,
                stroke: 'hsl(var(--background))',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'hsl(142 76% 46%)';
  if (score >= 50) return 'hsl(45 93% 47%)';
  return 'hsl(var(--destructive))';
}
