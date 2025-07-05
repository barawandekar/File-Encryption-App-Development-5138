import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiInfo, FiShield, FiLock, FiKey, FiAlertTriangle, FiCheckCircle, FiFolder, FiHardDrive } = FiIcons;

const SecurityInfo = () => {
  const securityFeatures = [
    {
      icon: FiShield,
      title: 'AES-256 Encryption',
      description: 'Military-grade encryption algorithm used by governments and security professionals worldwide.',
      color: 'from-green-600 to-emerald-600'
    },
    {
      icon: FiLock,
      title: 'Client-Side Processing',
      description: 'All encryption and decryption happens in your browser. Your files never leave your device.',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      icon: FiKey,
      title: 'Hardware Key Support',
      description: 'Optional YubiKey/FIDO2 authentication for maximum security using hardware-backed keys.',
      color: 'from-purple-600 to-pink-600'
    },
    {
      icon: FiFolder,
      title: 'Folder Encryption',
      description: 'Encrypt entire folders and maintain directory structure while keeping files secure.',
      color: 'from-yellow-600 to-orange-600'
    }
  ];

  const bestPractices = [
    {
      icon: FiCheckCircle,
      title: 'Use Strong Passwords',
      description: 'Create passwords with at least 12 characters including uppercase, lowercase, numbers, and symbols.',
      type: 'success'
    },
    {
      icon: FiCheckCircle,
      title: 'Enable Hardware Key',
      description: 'Use YubiKey or FIDO2 devices for additional security layer and phishing resistance.',
      type: 'success'
    },
    {
      icon: FiCheckCircle,
      title: 'Backup Encrypted Files',
      description: 'Keep multiple copies of your encrypted files in different secure locations.',
      type: 'success'
    },
    {
      icon: FiAlertTriangle,
      title: 'Password Recovery',
      description: 'If you lose your password or hardware key, your encrypted files cannot be recovered.',
      type: 'warning'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Security Features */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
            <SafeIcon icon={FiInfo} className="text-xl text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Security Features</h2>
            <p className="text-slate-300">How SecureVault protects your files and folders</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-700/50 border border-slate-600 rounded-xl p-6 hover:bg-slate-700/70 transition-colors"
            >
              <div className={`bg-gradient-to-r ${feature.color} p-3 rounded-lg w-fit mb-4`}>
                <SafeIcon icon={feature.icon} className="text-xl text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-300 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-3 rounded-xl">
            <SafeIcon icon={FiShield} className="text-xl text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Security Best Practices</h2>
            <p className="text-slate-300">Follow these guidelines to maximize your security</p>
          </div>
        </div>
        <div className="space-y-4">
          {bestPractices.map((practice, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start space-x-4 p-4 rounded-xl border ${
                practice.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-yellow-500/10 border-yellow-500/20'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                practice.type === 'success' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                <SafeIcon icon={practice.icon} className="text-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">{practice.title}</h3>
                <p className="text-slate-300 text-sm">{practice.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">Technical Details</h2>
        <div className="space-y-6 text-slate-300">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Encryption Algorithm</h3>
            <p className="text-sm">
              AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode) provides both 
              confidentiality and authenticity. The 256-bit key size ensures maximum security 
              against brute force attacks.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Key Derivation</h3>
            <p className="text-sm">
              PBKDF2 (Password-Based Key Derivation Function 2) with SHA-256 is used to derive 
              encryption keys from passwords. This includes salt and iterations to protect against 
              rainbow table attacks.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Hardware Key Integration</h3>
            <p className="text-sm">
              WebAuthn/FIDO2 compatible hardware keys generate cryptographic keys that are combined 
              with passwords using XOR operations for enhanced security. Hardware keys provide 
              phishing resistance and hardware-backed cryptography.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Folder Encryption</h3>
            <p className="text-sm">
              Entire folders are compressed into ZIP archives while maintaining directory structure. 
              Each file is individually encrypted before being added to the archive, ensuring both 
              structure preservation and security.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">File Format</h3>
            <p className="text-sm">
              Encrypted files contain metadata including salt, initialization vector, hardware key 
              information, and authentication tag. This ensures each encrypted file is unique and 
              tamper-evident.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityInfo;