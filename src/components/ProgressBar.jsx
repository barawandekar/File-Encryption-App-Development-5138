import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ progress, label }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-300">{Math.round(progress)}%</span>
      </div>
      
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
        />
      </div>
    </div>
  );
};

export default ProgressBar;