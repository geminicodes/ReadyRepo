import { motion } from 'framer-motion';
import { Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ProUpgradeBannerProps {
  feature: string;
  description: string;
}

export function ProUpgradeBanner({ feature, description }: ProUpgradeBannerProps) {
  const handleUpgradeClick = () => {
    toast({
      title: 'Coming Soon!',
      description: 'Pro features are launching soon. Join the waitlist!',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-secondary/30 bg-gradient-to-r from-secondary/10 via-secondary/5 to-primary/10 p-4"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />
      
      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              {feature}
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-medium">
                Pro
              </span>
            </h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        
        <Button
          onClick={handleUpgradeClick}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Upgrade to Pro
        </Button>
      </div>
    </motion.div>
  );
}
