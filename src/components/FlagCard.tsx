'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FlagCardProps {
  text: string;
  type: 'risk' | 'credibility';
  icon: ReactNode;
}

export function FlagCard({ text, type, icon }: FlagCardProps) {
  const cardColor =
    type === 'risk'
      ? 'bg-red-900/20 border-red-500/30'
      : 'bg-green-900/20 border-green-500/30';
  const textColor = type === 'risk' ? 'text-red-300' : 'text-green-300';
  const iconColor = type === 'risk' ? 'text-red-500' : 'text-green-500';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center p-3 rounded-lg border ${cardColor}`}
    >
      <div className={`mr-3 text-xl ${iconColor}`}>{icon}</div>
      <p className={`text-sm ${textColor}`}>{text}</p>
    </motion.div>
  );
}
