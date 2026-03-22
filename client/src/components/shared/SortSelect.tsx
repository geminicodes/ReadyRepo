import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'name-asc' | 'name-desc';

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  options?: { value: SortOption; label: string }[];
}

const defaultOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Score' },
  { value: 'lowest', label: 'Lowest Score' },
];

export function SortSelect({ value, onChange, options = defaultOptions }: SortSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <SelectTrigger className="w-[160px] gap-2">
        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
