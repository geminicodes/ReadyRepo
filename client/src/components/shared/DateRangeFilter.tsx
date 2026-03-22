import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, startOfDay } from 'date-fns';

export type DateRangePreset = 'all' | '7d' | '30d' | '90d' | 'custom';

interface DateRangeFilterProps {
  value: DateRangePreset;
  customRange?: { from: Date; to: Date };
  onChange: (preset: DateRangePreset, customRange?: { from: Date; to: Date }) => void;
}

const presets: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export function DateRangeFilter({ value, customRange, onChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({});

  const getDisplayText = () => {
    if (value === 'custom' && customRange) {
      return `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d')}`;
    }
    return presets.find((p) => p.value === value)?.label || 'All Time';
  };

  const handlePresetClick = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCalendar(true);
      return;
    }
    onChange(preset);
    setIsOpen(false);
    setShowCalendar(false);
  };

  const handleApplyCustom = () => {
    if (tempRange.from && tempRange.to) {
      onChange('custom', { from: tempRange.from, to: tempRange.to });
      setIsOpen(false);
      setShowCalendar(false);
      setTempRange({});
    }
  };

  const handleClear = () => {
    onChange('all');
    setTempRange({});
    setShowCalendar(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 min-w-[140px] justify-between"
        >
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2">
          {!showCalendar ? (
            <div className="space-y-1">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset.value)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    value === preset.value
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => handlePresetClick('custom')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  value === 'custom'
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                Custom Range...
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Select Range</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowCalendar(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CalendarComponent
                mode="range"
                selected={{
                  from: tempRange.from,
                  to: tempRange.to,
                }}
                onSelect={(range) => {
                  setTempRange({ from: range?.from, to: range?.to });
                }}
                numberOfMonths={1}
                disabled={(date) => date > new Date()}
                className="pointer-events-auto"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleClear}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleApplyCustom}
                  disabled={!tempRange.from || !tempRange.to}
                >
                  Apply
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function getDateRangeFilter(preset: DateRangePreset, customRange?: { from: Date; to: Date }) {
  const now = new Date();
  switch (preset) {
    case '7d':
      return { from: subDays(startOfDay(now), 7), to: now };
    case '30d':
      return { from: subDays(startOfDay(now), 30), to: now };
    case '90d':
      return { from: subDays(startOfDay(now), 90), to: now };
    case 'custom':
      return customRange;
    default:
      return undefined;
  }
}
