import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeIn } from '@/lib/animations';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps): ReactNode => {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
};
