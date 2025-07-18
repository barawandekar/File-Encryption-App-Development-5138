import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';
import './App.css';

const { FiLock, FiUnlock, FiFile, FiEye, FiEyeOff, FiKey } = FiIcons;

function App() {
  const [files, setFiles] = useState([]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setStatus({ type: '', message: '' });
  };

  const handleProcess = async () => {
    if (!files.length) {
      setStatus({ type: 'error', message: 'Please select files first' });
      return;
    }
    if (!password) {
      setStatus({ type: 'error', message: 'Please enter a password' });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: '', message: '' });

    try {
      // Process each file
      for (const file of files) {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          const fileData = e.target.result;
          
          // Create encryption key from password
          const encoder = new TextEncoder();
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
          );

          const key = await crypto.subtle.deriveKey(
            {
              name: 'PBKDF2',
              salt: salt,
              iterations: 100000,
              hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
          );

          if (isEncrypting) {
            // Encrypt
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptedData = await crypto.subtle.encrypt(
              { name: 'AES-GCM', iv },
              key,
              fileData
            );

            // Combine salt + IV + encrypted data
            const combinedData = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
            combinedData.set(salt, 0);
            combinedData.set(iv, salt.length);
            combinedData.set(new Uint8Array(encryptedData), salt.length + iv.length);

            // Download encrypted file with .enc extension
            const blob = new Blob([combinedData], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${file.name}.enc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } else {
            // Decrypt
            try {
              // Extract salt, IV and encrypted data
              const salt = new Uint8Array(fileData.slice(0, 16));
              const iv = new Uint8Array(fileData.slice(16, 28));
              const encryptedData = new Uint8Array(fileData.slice(28));

              // Recreate the key with the same salt
              const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
              );

              const key = await crypto.subtle.deriveKey(
                {
                  name: 'PBKDF2',
                  salt: salt,
                  iterations: 100000,
                  hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
              );

              const decryptedData = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                encryptedData
              );

              // Download decrypted file (remove .enc extension)
              const blob = new Blob([decryptedData], { type: 'application/octet-stream' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.name.replace('.enc', '');
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } catch (error) {
              setStatus({ type: 'error', message: 'Invalid password or corrupted file' });
              return;
            }
          }
        };

        reader.readAsArrayBuffer(file);
      }

      setStatus({
        type: 'success',
        message: `Files ${isEncrypting ? 'encrypted' : 'decrypted'} successfully!`
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Failed to ${isEncrypting ? 'encrypt' : 'decrypt'} files: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-md mx-auto bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <SafeIcon icon={isEncrypting ? FiLock : FiUnlock} className="text-3xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Simple File Encryption</h1>
          <p className="text-slate-300 mt-2">Secure your files with AES-256 encryption</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-700/50 rounded-lg p-1 mb-6">
          <button
            onClick={() => setIsEncrypting(true)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all ${
              isEncrypting
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <SafeIcon icon={FiLock} />
            <span>Encrypt</span>
          </button>
          <button
            onClick={() => setIsEncrypting(false)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all ${
              !isEncrypting
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <SafeIcon icon={FiUnlock} />
            <span>Decrypt</span>
          </button>
        </div>

        {/* File Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Select Files to {isEncrypting ? 'Encrypt' : 'Decrypt'}
          </label>
          <div
            onClick={() => document.getElementById('fileInput').click()}
            className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-slate-500 transition-colors"
          >
            <SafeIcon icon={FiFile} className="text-3xl text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300">
              {files.length ? (
                <span>{files.length} file(s) selected</span>
              ) : (
                <span>Click to select files</span>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isEncrypting ? 'Any file type' : 'Only .enc files'}
            </p>
            <input
              type="file"
              id="fileInput"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept={isEncrypting ? '*' : '.enc'}
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 pr-10"
              placeholder="Enter password"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
            >
              <SafeIcon icon={showPassword ? FiEyeOff : FiEye} />
            </button>
          </div>
        </div>

        {/* Status Message */}
        {status.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg mb-6 ${
              status.type === 'error'
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-green-500/10 border border-green-500/20 text-green-400'
            }`}
          >
            {status.message}
          </motion.div>
        )}

        {/* Process Button */}
        <button
          onClick={handleProcess}
          disabled={isProcessing || !files.length || !password}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed"
        >
          <SafeIcon icon={FiKey} className={isProcessing ? 'animate-spin' : ''} />
          <span>
            {isProcessing
              ? 'Processing...'
              : isEncrypting
              ? 'Encrypt Files'
              : 'Decrypt Files'}
          </span>
        </button>

        {/* Info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>
            {isEncrypting 
              ? 'Encrypted files will have .enc extension' 
              : 'Original filename will be restored'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;