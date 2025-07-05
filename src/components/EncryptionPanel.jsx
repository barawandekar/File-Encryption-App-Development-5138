import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { encryptFile, encryptMultipleFiles } from '../utils/encryption';
import FileDropZone from './FileDropZone';
import ProgressBar from './ProgressBar';
import YubiKeyAuth from './YubiKeyAuth';
import PasswordGenerator from './PasswordGenerator';

const { FiLock, FiDownload, FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff, FiShield, FiFolder } = FiIcons;

const EncryptionPanel = ({ onAddToHistory }) => {
  const [files, setFiles] = useState([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [useHardwareKey, setUseHardwareKey] = useState(false);
  const [hardwareKey, setHardwareKey] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [encryptedFile, setEncryptedFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileSelect = useCallback((selectedFiles) => {
    const fileList = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];
    setFiles(fileList);
    setError('');
    setSuccess('');
    setEncryptedFile(null);
  }, []);

  const handleHardwareKeyAuth = useCallback((key) => {
    setHardwareKey(key);
    setError('');
  }, []);

  const handleHardwareKeyError = useCallback((error) => {
    setError('Hardware key authentication failed: ' + error.message);
    setHardwareKey(null);
  }, []);

  const handlePasswordGenerated = useCallback((generatedPassword) => {
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
  }, []);

  const validateForm = () => {
    if (files.length === 0) {
      setError('Please select files to encrypt');
      return false;
    }
    
    if (!password) {
      setError('Please enter a password');
      return false;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (useHardwareKey && !hardwareKey) {
      setError('Please authenticate with your hardware key');
      return false;
    }
    
    return true;
  };

  const analyzeFiles = (files) => {
    const folderStructure = {};
    const individualFiles = [];
    
    files.forEach(file => {
      if (file.webkitRelativePath) {
        const pathParts = file.webkitRelativePath.split('/');
        const folderName = pathParts[0];
        if (!folderStructure[folderName]) {
          folderStructure[folderName] = [];
        }
        folderStructure[folderName].push(file);
      } else {
        individualFiles.push(file);
      }
    });
    
    return { folderStructure, individualFiles };
  };

  const handleEncrypt = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    setError('');
    setProgress(0);
    
    try {
      let encrypted;
      const hwKey = useHardwareKey ? hardwareKey : null;
      const { folderStructure, individualFiles } = analyzeFiles(files);
      const hasFolders = Object.keys(folderStructure).length > 0;
      
      if (files.length === 1 && !hasFolders) {
        // Single file encryption
        encrypted = await encryptFile(files[0], password, hwKey);
        setProgress(100);
        setSuccess('File encrypted successfully!');
      } else {
        // Multiple files or folder encryption
        encrypted = await encryptMultipleFiles(files, password, hwKey, (progressValue) => {
          setProgress(progressValue);
        });
        
        const folderCount = Object.keys(folderStructure).length;
        const fileCount = files.length;
        
        if (hasFolders) {
          setSuccess(`${folderCount} folder${folderCount > 1 ? 's' : ''} with ${fileCount} files encrypted successfully!`);
        } else {
          setSuccess(`${fileCount} files encrypted successfully!`);
        }
      }
      
      setEncryptedFile(encrypted);
      
      onAddToHistory({
        type: 'encrypt',
        fileName: files.length === 1 ? files[0].name : `${files.length} files`,
        fileSize: files.reduce((total, file) => total + file.size, 0),
        status: 'success',
        useHardwareKey: useHardwareKey
      });
    } catch (err) {
      setError('Encryption failed: ' + err.message);
      onAddToHistory({
        type: 'encrypt',
        fileName: files.length === 1 ? files[0].name : `${files.length} files`,
        fileSize: files.reduce((total, file) => total + file.size, 0),
        status: 'error',
        error: err.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadEncryptedFile = () => {
    if (!encryptedFile) return;
    
    const url = URL.createObjectURL(encryptedFile.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = encryptedFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderFileAnalysis = () => {
    if (files.length === 0) return null;
    
    const { folderStructure, individualFiles } = analyzeFiles(files);
    const folderCount = Object.keys(folderStructure).length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    return (
      <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
        <h3 className="text-lg font-medium text-white mb-3">
          Selected Content Analysis
        </h3>
        
        <div className="space-y-3">
          {/* Summary */}
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiFolder} className="text-blue-400" />
              <div>
                <p className="text-white font-medium">
                  {files.length} files • {formatFileSize(totalSize)}
                </p>
                <p className="text-slate-400 text-sm">
                  {folderCount > 0 && `${folderCount} folders • `}
                  {individualFiles.length > 0 && `${individualFiles.length} individual files`}
                </p>
              </div>
            </div>
          </div>
          
          {/* Folder breakdown */}
          {folderCount > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-300">Folders:</h4>
              {Object.entries(folderStructure).map(([folderName, folderFiles]) => (
                <div key={folderName} className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiFolder} className="text-green-400 text-sm" />
                    <span className="text-green-400 text-sm">📁 {folderName}</span>
                  </div>
                  <span className="text-slate-400 text-xs">
                    {folderFiles.length} files • {formatFileSize(folderFiles.reduce((sum, f) => sum + f.size, 0))}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Individual files */}
          {individualFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-300">Individual Files:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {individualFiles.slice(0, 5).map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg">
                    <span className="text-blue-400 text-sm truncate">{file.name}</span>
                    <span className="text-slate-400 text-xs">{formatFileSize(file.size)}</span>
                  </div>
                ))}
                {individualFiles.length > 5 && (
                  <p className="text-slate-500 text-xs text-center">
                    ... and {individualFiles.length - 5} more files
                  </p>
                )}
              </div>
            </div>
          )}
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
      {/* Main Encryption Panel */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-3 rounded-xl">
            <SafeIcon icon={FiLock} className="text-xl text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Encrypt Files & Folders</h2>
            <p className="text-slate-300">Secure your files and folders with AES-256 encryption</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* File Selection */}
          <FileDropZone
            onFileSelect={handleFileSelect}
            selectedFiles={files}
            allowMultiple={true}
            allowFolders={true}
            placeholder="Drop files and folders here or click to browse"
          />

          {/* File Analysis */}
          {renderFileAnalysis()}

          {/* Password Generator */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Password Generation</h3>
            <PasswordGenerator 
              onPasswordGenerated={handlePasswordGenerated}
              className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4"
            />
          </div>

          {/* Password Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter encryption password"
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

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <SafeIcon icon={showConfirmPassword ? FiEyeOff : FiEye} className="text-lg" />
                </button>
              </div>
            </div>
          </div>

          {/* Hardware Key Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="useHardwareKey"
              checked={useHardwareKey}
              onChange={(e) => setUseHardwareKey(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500 focus:ring-2"
            />
            <label htmlFor="useHardwareKey" className="flex items-center space-x-2 text-slate-300">
              <SafeIcon icon={FiShield} className="text-sm" />
              <span>Use Hardware Key (YubiKey/FIDO2) for additional security</span>
            </label>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <ProgressBar progress={progress} label="Encrypting files..." />
          )}

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
              onClick={handleEncrypt}
              disabled={isProcessing || files.length === 0 || !password}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={FiLock} className="text-lg" />
              <span>{isProcessing ? 'Encrypting...' : 'Encrypt Files'}</span>
            </button>

            {encryptedFile && (
              <button
                onClick={downloadEncryptedFile}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200"
              >
                <SafeIcon icon={FiDownload} className="text-lg" />
                <span>Download Encrypted {files.length === 1 ? 'File' : 'Archive'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hardware Key Authentication */}
      {useHardwareKey && (
        <YubiKeyAuth
          onAuthSuccess={handleHardwareKeyAuth}
          onAuthError={handleHardwareKeyError}
          isRequired={true}
        />
      )}
    </motion.div>
  );
};

export default EncryptionPanel;