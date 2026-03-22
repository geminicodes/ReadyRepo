import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { toneColors, toneLabels } from '@/types/history';

type Tone = 'startup' | 'corporate' | 'formal' | 'casual' | 'innovative';

interface ToneFilterProps {
  value: Tone[];
  onChange: (tones: Tone[]) => void;
}

const allTones: Tone[] = ['startup', 'corporate', 'formal', 'casual', 'innovative'];

export function ToneFilter({ value, onChange }: ToneFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (tone: Tone) => {
    if (value.includes(tone)) {
      onChange(value.filter((t) => t !== tone));
    } else {
      onChange([...value, tone]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const displayText = value.length === 0 
    ? 'All Tones' 
    : value.length === 1 
    ? toneLabels[value[0]] 
    : `${value.length} selected`;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 min-w-[120px] justify-between ${
            value.length > 0 ? 'border-primary/50' : ''
          }`}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Filter by Tone</span>
            {value.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleClearAll}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {allTones.map((tone) => (
              <label
                key={tone}
                className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={value.length === 0 || value.includes(tone)}
                  onCheckedChange={() => handleToggle(tone)}
                />
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium border ${toneColors[tone]}`}
                >
                  {toneLabels[tone]}
                </span>
              </label>
            ))}
          </div>

          {value.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 border-t border-border">
              {value.map((tone) => (
                <span
                  key={tone}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium border flex items-center gap-1 ${toneColors[tone]}`}
                >
                  {toneLabels[tone]}
                  <button
                    onClick={() => handleToggle(tone)}
                    className="hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
