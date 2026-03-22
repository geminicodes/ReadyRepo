import { motion } from 'framer-motion';
import { MessageCircle, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedbackCTAProps {
  onFeedbackClick: () => void;
}

export function FeedbackCTA({ onFeedbackClick }: FeedbackCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10" />
      
      {/* Animated Border */}
      <div className="absolute inset-0 rounded-2xl gradient-border opacity-50" />

      <div className="relative glass rounded-2xl p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Content */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <Heart className="w-5 h-5 text-secondary" />
              <span className="text-sm font-medium text-secondary">Help Us Improve</span>
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Your Feedback Matters
            </h3>
            <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">Join 50+ developers shaping ReadyRepo</span>
            </div>
          </div>

          {/* Right CTA */}
          <Button 
            variant="hero" 
            size="xl" 
            onClick={onFeedbackClick}
            className="group whitespace-nowrap"
          >
            <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Share Your Feedback
          </Button>
        </div>
      </div>
    </motion.div>
  );
}