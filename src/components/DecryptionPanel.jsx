import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { decryptFile, decryptZipFile, downloadWithFolderStructure } from '../utils/encryption';
import FileDropZone from './FileDropZone';
import ProgressBar from './ProgressBar';
import YubiKeyAuth from './YubiKeyAuth';

const { FiUnlock, FiDownload, FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff, FiShield, FiArchive, FiFolder } = FiIcons;

const DecryptionPanel = ({ onAddToHistory }) => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requiresHardwareKey, setRequiresHardwareKey] = useState(false);
  const [hardwareKey, setHardwareKey] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [decryptedResult, setDecryptedResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setError('');
    setSuccess('');
    setDecryptedResult(null);
    setRequiresHardwareKey(false);
    setHardwareKey(null);
  }, []);

  const handleHardwareKeyAuth = useCallback((key) => {
    setHardwareKey(key);
    setError('');
  }, []);

  const handleHardwareKeyError = useCallback((error) => {
    setError('Hardware key authentication failed: ' + error.message);
    setHardwareKey(null);
  }, []);

  const validateForm = () => {
    if (!file) {
      setError('Please select an encrypted file');
      return false;
    }
    if (!password) {
      setError('Please enter the decryption password');
      return false;
    }
    if (requiresHardwareKey && !hardwareKey) {
      setError('Hardware key authentication required for this file');
      return false;
    }
    return true;
  };

  const handleDecrypt = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setError('');
    setProgress(0);

    try {
      const hwKey = requiresHardwareKey ? hardwareKey : null;
      let decrypted;

      // Check if it's a zip file (multiple files/folders)
      if (file.name.endsWith('.zip')) {
        decrypted = await decryptZipFile(file, password, hwKey, (progressValue) => {
          setProgress(progressValue);
        });
        
        const fileCount = decrypted.files.length;
        const folderCount = decrypted.metadata?.folderCount || 0;
        
        setDecryptedResult(decrypted);
        setSuccess(
          `Successfully decrypted ${fileCount} files${folderCount > 0 ? ` from ${folderCount} folders` : ''}!`
        );
      } else {
        // Single file decryption
        setProgress(50);
        decrypted = await decryptFile(file, password, hwKey);
        setProgress(100);
        
        setDecryptedResult({ files: [decrypted] });
        setSuccess('File decrypted successfully!');
      }

      onAddToHistory({
        type: 'decrypt',
        fileName: file.name,
        fileSize: file.size,
        status: 'success',
        useHardwareKey: requiresHardwareKey
      });
    } catch (err) {
      // Check if error indicates hardware key requirement
      if (err.message.includes('Hardware key authentication required')) {
        setRequiresHardwareKey(true);
        setError('This file requires hardware key authentication');
      } else {
        setError('Decryption failed: ' + err.message);
      }

      onAddToHistory({
        type: 'decrypt',
        fileName: file.name,
        fileSize: file.size,
        status: 'error',
        error: err.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadDecryptedFiles = () => {
    if (!decryptedResult) return;

    if (decryptedResult.files.length === 1 && !decryptedResult.metadata) {
      // Single file download
      const file = decryptedResult.files[0];
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Multiple files or folder structure - download as zip with structure preserved
      downloadWithFolderStructure(decryptedResult, 'decrypted-files');
    }
  };

  const renderDecryptedPreview = () => {
    if (!decryptedResult) return null;

    const files = decryptedResult.files;
    const metadata = decryptedResult.metadata;

    // Group files by folder structure
    const folderGroups = {};
    const individualFiles = [];

    files.forEach(file => {
      if (file.metadata.folderStructure && file.metadata.folderStructure.length > 0) {
        const folderName = file.metadata.folderStructure[0];
        if (!folderGroups[folderName]) {
          folderGroups[folderName] = [];
        }
        folderGroups[folderName].push(file);
      } else {
        individualFiles.push(file);
      }
    });

    return (
      <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
        <h3 className="text-lg font-medium text-white mb-3">
          Decrypted Content ({files.length} files)
        </h3>
        
        {metadata && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <SafeIcon icon={FiArchive} className="text-blue-400" />
              <span className="text-blue-400 font-medium">Archive Information</span>
            </div>
            <div className="text-sm text-slate-300 space-y-1">
              {metadata.folderCount > 0 && (
                <p>📁 {metadata.folderCount} folders</p>
              )}
              {metadata.individualFileCount > 0 && (
                <p>📄 {metadata.individualFileCount} individual files</p>
              )}
              <p>🕒 Created: {new Date(metadata.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {/* Display folders */}
          {Object.entries(folderGroups).map(([folderName, folderFiles]) => (
            <div key={folderName} className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <SafeIcon icon={FiFolder} className="text-green-400" />
                <span className="text-green-400 font-medium">📁 {folderName}</span>
                <span className="text-slate-400 text-sm">({folderFiles.length} files)</span>
              </div>
              <div className="ml-6 space-y-1">
                {folderFiles.slice(0, 5).map((file, idx) => (
                  <p key={idx} className="text-xs text-slate-400 truncate">
                    {file.metadata.relativePath.split('/').slice(1).join('/')}
                  </p>
                ))}
                {folderFiles.length > 5 && (
                  <p className="text-xs text-slate-500">
                    ... and {folderFiles.length - 5} more files
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Display individual files */}
          {individualFiles.map((file, index) => (
            <div key={`individual-${index}`} className="flex items-center space-x-3 p-2 bg-slate-800/50 rounded-lg">
              <SafeIcon icon={FiArchive} className="text-blue-400" />
              <span className="text-slate-300 text-sm">{file.filename}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Main Decryption Panel */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-3 rounded-xl">
            <SafeIcon icon={FiUnlock} className="text-xl text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Decrypt Files & Folders</h2>
            <p className="text-slate-300">Restore your encrypted files and folder structures</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* File Selection */}
          <FileDropZone
            onFileSelect={handleFileSelect}
            selectedFiles={file}
            acceptedTypes=".enc,.encrypted,.zip"
            placeholder="Drop encrypted files (.enc) or archives (.zip) here"
          />

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Decryption Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the password used for encryption"
                className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
              >
                <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="text-lg" />
              </button>
            </div>
          </div>

          {/* Hardware Key Requirement Notice */}
          {requiresHardwareKey && (
            <div className="flex items-center space-x-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <SafeIcon icon={FiShield} className="text-yellow-400" />
              <span className="text-yellow-400">This file requires hardware key authentication</span>
            </div>
          )}

          {/* Progress Bar */}
          {isProcessing && (
            <ProgressBar progress={progress} label="Decrypting files..." />
          )}

          {/* Decrypted Files Preview */}
          {decryptedResult && renderDecryptedPreview()}

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <SafeIcon icon={FiAlertCircle} className="text-red-400" />
              <span className="text-red-400">{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
            >
              <SafeIcon icon={FiCheckCircle} className="text-green-400" />
              <span className="text-green-400">{success}</span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDecrypt}
              disabled={isProcessing || !file || !password}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={FiUnlock} className="text-lg" />
              <span>{isProcessing ? 'Decrypting...' : 'Decrypt Files'}</span>
            </button>

            {decryptedResult && (
              <button
                onClick={downloadDecryptedFiles}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200"
              >
                <SafeIcon icon={FiDownload} className="text-lg" />
                <span>Download {decryptedResult.files.length === 1 ? 'File' : 'Archive'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hardware Key Authentication */}
      {requiresHardwareKey && (
        <YubiKeyAuth
          onAuthSuccess={handleHardwareKeyAuth}
          onAuthError={handleHardwareKeyError}
          isRequired={true}
        />
      )}
    </motion.div>
  );
};

export default DecryptionPanel;