import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function LoadingScreen({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 animated-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="glass rounded-2xl px-6 py-5 flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            aria-hidden="true"
          >
            <Loader2 className="w-5 h-5 text-primary" />
          </motion.div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
      </div>
    </div>
  );
}
