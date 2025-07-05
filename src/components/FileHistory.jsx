import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiClock, FiLock, FiUnlock, FiCheckCircle, FiXCircle, FiTrash2, FiShield, FiFolder } = FiIcons;

const FileHistory = ({ history, onClearHistory }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 rounded-xl">
            <SafeIcon icon={FiClock} className="text-xl text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">File History</h2>
            <p className="text-slate-300">Recent encryption and decryption operations</p>
          </div>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
          >
            <SafeIcon icon={FiTrash2} className="text-sm" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-slate-700/50 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <SafeIcon icon={FiClock} className="text-2xl text-slate-400" />
          </div>
          <p className="text-slate-400 text-lg">No operations yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Your encryption and decryption history will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 hover:bg-slate-700/70 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    entry.type === 'encrypt' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    <SafeIcon icon={entry.type === 'encrypt' ? FiLock : FiUnlock} className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-medium">{entry.fileName}</p>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                        entry.status === 'success' 
                          ? 'bg-green-500/10 text-green-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        <SafeIcon icon={entry.status === 'success' ? FiCheckCircle : FiXCircle} className="text-xs" />
                        <span>{entry.status}</span>
                      </div>
                      {entry.useHardwareKey && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs">
                          <SafeIcon icon={FiShield} className="text-xs" />
                          <span>HW Key</span>
                        </div>
                      )}
                      {entry.fileName.includes('files') && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs">
                          <SafeIcon icon={FiFolder} className="text-xs" />
                          <span>Multiple</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-400 mt-1">
                      <span>{formatFileSize(entry.fileSize)}</span>
                      <span>•</span>
                      <span>{format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                      <span>•</span>
                      <span className="capitalize">{entry.type}ed</span>
                    </div>
                    {entry.error && (
                      <p className="text-red-400 text-sm mt-1">{entry.error}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default FileHistory;