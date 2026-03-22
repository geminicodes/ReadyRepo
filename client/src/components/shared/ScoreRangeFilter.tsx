import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

interface ScoreRangeFilterProps {
  value: [number, number];
  onChange: (range: [number, number]) => void;
}

export function ScoreRangeFilter({ value, onChange }: ScoreRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState<[number, number]>(value);

  const handleApply = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempValue([0, 100]);
    onChange([0, 100]);
    setIsOpen(false);
  };

  const isFiltered = value[0] > 0 || value[1] < 100;
  const displayText = isFiltered ? `${value[0]} - ${value[1]}` : 'All Scores';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 min-w-[120px] justify-between ${
            isFiltered ? 'border-primary/50' : ''
          }`}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Score Range</span>
            <span className="text-sm text-muted-foreground">
              {tempValue[0]} - {tempValue[1]}
            </span>
          </div>
          
          <div className="px-1">
            <Slider
              value={tempValue}
              onValueChange={(v) => setTempValue(v as [number, number])}
              min={0}
              max={100}
              step={5}
              className="my-4"
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-destructive">Needs Work</span>
            <span className="text-yellow-500">Good</span>
            <span className="text-green-500">Excellent</span>
          </div>

          <div className="flex gap-2 pt-2">
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
              onClick={handleApply}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
