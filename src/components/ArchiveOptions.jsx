import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArchive, FiInfo, FiChevronDown, FiChevronUp, FiSettings, FiLock, FiZap, FiClock, FiHardDrive, FiEye, FiEyeOff } = FiIcons;

const ArchiveOptions = ({ onOptionsChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState({
    format: 'zip', // 'zip' or '7z'
    compressionLevel: 5,
    compressionMethod: 'LZMA2',
    encryptFilenames: true,
    solidArchive: true,
    customName: '',
    // New filename encryption options
    filenameEncryptionMode: 'full', // 'none', 'partial', 'full'
    preserveExtensions: false,
    customPrefix: ''
  });

  const handleOptionChange = (key, value) => {
    const newOptions = { ...options, [key]: value };
    
    // Auto-adjust related options
    if (key === 'format') {
      if (value === 'zip') {
        // ZIP format has limited filename encryption capabilities
        newOptions.filenameEncryptionMode = newOptions.encryptFilenames ? 'partial' : 'none';
      } else if (value === '7z') {
        // Enhanced format supports full filename encryption
        newOptions.filenameEncryptionMode = newOptions.encryptFilenames ? 'full' : 'none';
      }
    }
    
    if (key === 'encryptFilenames') {
      if (!value) {
        newOptions.filenameEncryptionMode = 'none';
      } else {
        newOptions.filenameEncryptionMode = options.format === '7z' ? 'full' : 'partial';
      }
    }

    setOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const compressionMethods = {
    'LZMA': { 
      icon: FiClock, 
      name: 'LZMA', 
      desc: 'Excellent compression, slower',
      color: 'text-purple-400'
    },
    'LZMA2': { 
      icon: FiZap, 
      name: 'LZMA2', 
      desc: 'Best balance, multithreaded',
      color: 'text-green-400'
    },
    'PPMd': { 
      icon: FiInfo, 
      name: 'PPMd', 
      desc: 'Best for text files',
      color: 'text-blue-400'
    },
    'BZip2': { 
      icon: FiHardDrive, 
      name: 'BZip2', 
      desc: 'Good compression, faster',
      color: 'text-orange-400'
    }
  };

  const compressionLevels = [
    { value: 0, label: 'Store (No compression)', speed: 'Fastest', size: 'Largest' },
    { value: 1, label: 'Fastest', speed: 'Very Fast', size: 'Large' },
    { value: 3, label: 'Fast', speed: 'Fast', size: 'Medium' },
    { value: 5, label: 'Normal (Recommended)', speed: 'Medium', size: 'Good' },
    { value: 7, label: 'High', speed: 'Slow', size: 'Small' },
    { value: 9, label: 'Ultra', speed: 'Very Slow', size: 'Smallest' }
  ];

  const filenameEncryptionModes = {
    'none': {
      title: 'No Encryption',
      desc: 'Original filenames visible',
      icon: FiEye,
      color: 'text-red-400',
      example: 'document.pdf'
    },
    'partial': {
      title: 'Partial Encryption',
      desc: 'Filenames obfuscated but readable',
      icon: FiEyeOff,
      color: 'text-yellow-400',
      example: 'enc_a7b2c9d4_document.pdf'
    },
    'full': {
      title: 'Full Encryption',
      desc: 'Filenames completely hidden',
      icon: FiLock,
      color: 'text-green-400',
      example: 'f7e8c2a1b9d6.enc'
    }
  };

  const getFilenamePreview = () => {
    const originalName = "my-document.pdf";
    const prefix = options.customPrefix || "enc";
    
    switch (options.filenameEncryptionMode) {
      case 'none':
        return originalName;
      case 'partial':
        if (options.preserveExtensions) {
          return `${prefix}_a7b2c9d4_my-document.pdf`;
        }
        return `${prefix}_a7b2c9d4_my-document.enc`;
      case 'full':
        return options.preserveExtensions ? 'f7e8c2a1b9d6.pdf' : 'f7e8c2a1b9d6.enc';
      default:
        return originalName;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Archive Format Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">Archive Format</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOptionChange('format', 'zip')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              options.format === 'zip'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiArchive} className={`text-xl ${options.format === 'zip' ? 'text-blue-400' : 'text-slate-400'}`} />
              <div className="text-left">
                <h3 className={`font-medium ${options.format === 'zip' ? 'text-blue-400' : 'text-slate-300'}`}>
                  ZIP Archive
                </h3>
                <p className="text-xs text-slate-400">Standard format, wide compatibility</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleOptionChange('format', '7z')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              options.format === '7z'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiLock} className={`text-xl ${options.format === '7z' ? 'text-purple-400' : 'text-slate-400'}`} />
              <div className="text-left">
                <h3 className={`font-medium ${options.format === '7z' ? 'text-purple-400' : 'text-slate-300'}`}>
                  Enhanced Archive
                </h3>
                <p className="text-xs text-slate-400">Better compression, full filename encryption</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Filename Encryption Options - Available for both formats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">Filename Protection</h3>
          <span className="text-xs text-slate-400">
            {options.format === '7z' ? 'Full encryption available' : 'Obfuscation available'}
          </span>
        </div>

        {/* Filename Encryption Mode Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">Protection Level</label>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(filenameEncryptionModes).map(([mode, config]) => {
              const isDisabled = mode === 'full' && options.format === 'zip';
              
              return (
                <label 
                  key={mode} 
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                    isDisabled 
                      ? 'bg-slate-800/30 opacity-50 cursor-not-allowed' 
                      : 'bg-slate-700/50 hover:bg-slate-700/70'
                  } ${
                    options.filenameEncryptionMode === mode && !isDisabled
                      ? 'ring-2 ring-purple-500/50 bg-purple-500/10'
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="filenameEncryptionMode"
                    value={mode}
                    checked={options.filenameEncryptionMode === mode}
                    onChange={(e) => !isDisabled && handleOptionChange('filenameEncryptionMode', e.target.value)}
                    disabled={isDisabled}
                    className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 focus:ring-purple-500"
                  />
                  <SafeIcon icon={config.icon} className={`text-sm ${config.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-300 font-medium">{config.title}</span>
                      {isDisabled && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                          Requires Enhanced Format
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{config.desc}</p>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      Example: {mode === 'full' && options.format === 'zip' ? 'Not available' : config.example}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Advanced Filename Options */}
        {options.filenameEncryptionMode !== 'none' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 space-y-4"
          >
            <h4 className="text-sm font-medium text-slate-300 flex items-center space-x-2">
              <SafeIcon icon={FiSettings} className="text-sm" />
              <span>Filename Protection Settings</span>
            </h4>

            {/* Preserve Extensions Option */}
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm text-slate-300">Preserve File Extensions</h5>
                <p className="text-xs text-slate-400">
                  Keep original extensions visible (e.g., .pdf, .jpg)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.preserveExtensions}
                  onChange={(e) => handleOptionChange('preserveExtensions', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Custom Prefix for Partial Encryption */}
            {options.filenameEncryptionMode === 'partial' && (
              <div className="space-y-2">
                <label className="block text-sm text-slate-300">Custom Prefix</label>
                <input
                  type="text"
                  value={options.customPrefix}
                  onChange={(e) => handleOptionChange('customPrefix', e.target.value)}
                  placeholder="enc"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-slate-400">
                  Prefix for obfuscated filenames (default: "enc")
                </p>
              </div>
            )}

            {/* Filename Preview */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
              <h5 className="text-sm font-medium text-slate-300 mb-2">Preview</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Original:</span>
                  <code className="text-green-400 bg-slate-800/50 px-2 py-1 rounded">my-document.pdf</code>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Protected:</span>
                  <code className="text-blue-400 bg-slate-800/50 px-2 py-1 rounded">{getFilenamePreview()}</code>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className={`p-3 rounded-lg border ${
              options.filenameEncryptionMode === 'full' 
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-yellow-500/10 border-yellow-500/20'
            }`}>
              <div className="flex items-start space-x-2">
                <SafeIcon 
                  icon={options.filenameEncryptionMode === 'full' ? FiLock : FiInfo} 
                  className={`text-sm mt-0.5 ${
                    options.filenameEncryptionMode === 'full' ? 'text-green-400' : 'text-yellow-400'
                  }`} 
                />
                <div className="text-sm">
                  <p className={`font-medium ${
                    options.filenameEncryptionMode === 'full' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {options.filenameEncryptionMode === 'full' 
                      ? 'Maximum Security' 
                      : 'Moderate Security'}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {options.filenameEncryptionMode === 'full'
                      ? 'Original filenames are completely encrypted and unrecoverable without the password.'
                      : 'Filenames are obfuscated but may still reveal some information about file types.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Enhanced Archive Specific Options */}
      {options.format === '7z' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          {/* Advanced Options Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 rounded-xl text-slate-300 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiSettings} className="text-sm" />
              <span>Advanced Compression Settings</span>
            </div>
            <SafeIcon icon={isOpen ? FiChevronUp : FiChevronDown} className="text-sm" />
          </button>

          {/* Advanced Settings */}
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-800/50 border border-slate-600 rounded-xl p-4 space-y-4"
            >
              {/* Compression Method */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Compression Method</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(compressionMethods).map(([key, method]) => (
                    <label key={key} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="compressionMethod"
                        checked={options.compressionMethod === key}
                        onChange={() => handleOptionChange('compressionMethod', key)}
                        className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 focus:ring-purple-500"
                      />
                      <SafeIcon icon={method.icon} className={`text-sm ${method.color}`} />
                      <div className="flex-1">
                        <span className="text-slate-300 font-medium">{method.name}</span>
                        <p className="text-xs text-slate-400">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Compression Level */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Compression Level: {compressionLevels.find(l => l.value === options.compressionLevel)?.label}
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="9"
                    step="2"
                    value={options.compressionLevel}
                    onChange={(e) => handleOptionChange('compressionLevel', parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Fastest</span>
                    <span>Balanced</span>
                    <span>Best</span>
                  </div>
                </div>
                
                {/* Level Info */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-700/50 p-2 rounded text-center">
                    <div className="text-slate-400">Speed</div>
                    <div className="text-blue-400 font-medium">
                      {compressionLevels.find(l => l.value === options.compressionLevel)?.speed}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-2 rounded text-center">
                    <div className="text-slate-400">Size</div>
                    <div className="text-green-400 font-medium">
                      {compressionLevels.find(l => l.value === options.compressionLevel)?.size}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-2 rounded text-center">
                    <div className="text-slate-400">CPU</div>
                    <div className="text-orange-400 font-medium">
                      {options.compressionLevel <= 1 ? 'Low' : options.compressionLevel <= 5 ? 'Medium' : 'High'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Solid Archive */}
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-slate-300">Solid Archive</h4>
                  <p className="text-xs text-slate-400">Better compression for multiple files</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.solidArchive}
                    onChange={(e) => handleOptionChange('solidArchive', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Custom Archive Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Custom Archive Name (Optional)</label>
                <input
                  type="text"
                  value={options.customName}
                  onChange={(e) => handleOptionChange('customName', e.target.value)}
                  placeholder="Leave empty for auto-generated name"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-slate-400">
                  Will be saved as: {options.customName || `encrypted-archive-${new Date().toISOString().split('T')[0]}`}.{options.format}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Format Comparison */}
      <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Format Comparison</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Compatibility:</span>
            <span className={options.format === 'zip' ? 'text-green-400' : 'text-yellow-400'}>
              {options.format === 'zip' ? 'Universal' : 'Good (modern browsers)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Compression:</span>
            <span className={options.format === '7z' ? 'text-green-400' : 'text-blue-400'}>
              {options.format === '7z' ? 'Excellent' : 'Good'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Filename Protection:</span>
            <span className={
              options.filenameEncryptionMode === 'full' ? 'text-green-400' :
              options.filenameEncryptionMode === 'partial' ? 'text-yellow-400' : 'text-red-400'
            }>
              {options.filenameEncryptionMode === 'full' ? 'Full Encryption' :
               options.filenameEncryptionMode === 'partial' ? 'Obfuscation' : 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Speed:</span>
            <span className={options.format === 'zip' ? 'text-green-400' : 'text-yellow-400'}>
              {options.format === 'zip' ? 'Fast' : 'Medium'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveOptions;