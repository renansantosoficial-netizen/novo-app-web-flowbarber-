import React from 'react';
import { motion } from 'motion/react';

export const Card = ({ children, className = "", delay = 0, onClick }: { children: React.ReactNode, className?: string, delay?: number, onClick?: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    onClick={onClick}
    className={`apple-glass ${className}`}
  >
    {children}
  </motion.div>
);
