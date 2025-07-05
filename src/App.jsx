import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './components/Header';
import EncryptionPanel from './components/EncryptionPanel';
import DecryptionPanel from './components/DecryptionPanel';
import FileHistory from './components/FileHistory';
import SecurityInfo from './components/SecurityInfo';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('encrypt');
  const [fileHistory, setFileHistory] = useState([]);

  const addToHistory = (entry) => {
    setFileHistory(prev => [
      {
        ...entry,
        id: Date.now(),
        timestamp: new Date().toISOString()
      },
      ...prev.slice(0, 9) // Keep only last 10 entries
    ]);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-2 border border-slate-700">
                <div className="flex space-x-2">
                  {[
                    { id: 'encrypt', label: 'Encrypt Files' },
                    { id: 'decrypt', label: 'Decrypt Files' },
                    { id: 'history', label: 'History' },
                    { id: 'security', label: 'Security Info' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'encrypt' && (
                <EncryptionPanel onAddToHistory={addToHistory} />
              )}
              {activeTab === 'decrypt' && (
                <DecryptionPanel onAddToHistory={addToHistory} />
              )}
              {activeTab === 'history' && (
                <FileHistory history={fileHistory} onClearHistory={() => setFileHistory([])} />
              )}
              {activeTab === 'security' && (
                <SecurityInfo />
              )}
            </motion.div>
          </motion.div>
        </main>
      </div>
    </Router>
  );
}

export default App;