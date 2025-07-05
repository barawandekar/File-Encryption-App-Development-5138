import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiShield, FiLock } = FiIcons;

const Header = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
      <div className="container mx-auto px-4 py-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-xl">
              <SafeIcon icon={FiShield} className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">SecureVault</h1>
              <p className="text-slate-300">Advanced File Encryption System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-slate-700/50 px-4 py-2 rounded-lg">
            <SafeIcon icon={FiLock} className="text-green-400" />
            <span className="text-sm text-slate-300">AES-256 Encryption</span>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;