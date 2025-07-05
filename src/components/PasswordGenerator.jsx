import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiKey, FiRefreshCw, FiCopy, FiCheck, FiSettings, FiEye, FiEyeOff, FiChevronDown, FiChevronUp, FiTarget, FiSliders } = FiIcons;

const PasswordGenerator = ({ onPasswordGenerated, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSymbolOptions, setShowSymbolOptions] = useState(false);
  const [showCharacterCounts, setShowCharacterCounts] = useState(false);
  const [showMinMaxControls, setShowMinMaxControls] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Password generation options
  const [options, setOptions] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
    symbolCategories: {
      basic: true,        // !@#$%^&*
      brackets: true,     // []{}()
      punctuation: true,  // .,;:'"
      math: true,         // +-=/<>
      special: false      // ~`|\_
    },
    customSymbols: '',
    useSpecificCounts: false,
    characterCounts: {
      uppercase: 2,
      lowercase: 8,
      numbers: 2,
      symbols: 2
    },
    // New min/max controls
    useMinMaxLimits: false,
    minMaxLimits: {
      uppercase: { min: 1, max: 8 },
      lowercase: { min: 1, max: 12 },
      numbers: { min: 1, max: 6 },
      symbols: { min: 1, max: 4 }
    }
  });

  const characterSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: {
      basic: '!@#$%^&*',
      brackets: '[]{}()',
      punctuation: '.,;:\'"',
      math: '+-=/<>',
      special: '~`|\\_'
    },
    similar: 'il1Lo0O',
    ambiguous: '{}[]()/\\\'"`~,;.<>'
  };

  const generatePassword = useCallback(() => {
    if (options.useSpecificCounts) {
      return generatePasswordWithCounts();
    } else if (options.useMinMaxLimits) {
      return generatePasswordWithMinMax();
    } else {
      return generatePasswordTraditional();
    }
  }, [options]);

  const generatePasswordWithMinMax = () => {
    const limits = options.minMaxLimits;
    let password = '';
    const usedCounts = {
      uppercase: 0,
      lowercase: 0,
      numbers: 0,
      symbols: 0
    };

    // Generate minimum required characters for each type
    if (options.includeUppercase) {
      let charset = characterSets.uppercase;
      if (options.excludeSimilar) {
        charset = charset.split('').filter(char => !characterSets.similar.includes(char)).join('');
      }
      const minCount = Math.max(0, limits.uppercase.min);
      for (let i = 0; i < minCount; i++) {
        password += getRandomChar(charset);
        usedCounts.uppercase++;
      }
    }

    if (options.includeLowercase) {
      let charset = characterSets.lowercase;
      if (options.excludeSimilar) {
        charset = charset.split('').filter(char => !characterSets.similar.includes(char)).join('');
      }
      const minCount = Math.max(0, limits.lowercase.min);
      for (let i = 0; i < minCount; i++) {
        password += getRandomChar(charset);
        usedCounts.lowercase++;
      }
    }

    if (options.includeNumbers) {
      let charset = characterSets.numbers;
      if (options.excludeSimilar) {
        charset = charset.split('').filter(char => !characterSets.similar.includes(char)).join('');
      }
      const minCount = Math.max(0, limits.numbers.min);
      for (let i = 0; i < minCount; i++) {
        password += getRandomChar(charset);
        usedCounts.numbers++;
      }
    }

    if (options.includeSymbols) {
      let symbolSet = '';
      Object.entries(options.symbolCategories).forEach(([category, enabled]) => {
        if (enabled && characterSets.symbols[category]) {
          symbolSet += characterSets.symbols[category];
        }
      });
      
      if (options.customSymbols) {
        symbolSet += options.customSymbols;
      }

      if (options.excludeAmbiguous) {
        symbolSet = symbolSet.split('').filter(char => !characterSets.ambiguous.includes(char)).join('');
      }

      const minCount = Math.max(0, limits.symbols.min);
      for (let i = 0; i < minCount; i++) {
        password += getRandomChar(symbolSet);
        usedCounts.symbols++;
      }
    }

    // Fill remaining length with random characters, respecting max limits
    const remainingLength = options.length - password.length;
    
    for (let i = 0; i < remainingLength; i++) {
      const availableTypes = [];
      
      // Check which character types can still be added (within max limits)
      if (options.includeUppercase && usedCounts.uppercase < limits.uppercase.max) {
        availableTypes.push('uppercase');
      }
      if (options.includeLowercase && usedCounts.lowercase < limits.lowercase.max) {
        availableTypes.push('lowercase');
      }
      if (options.includeNumbers && usedCounts.numbers < limits.numbers.max) {
        availableTypes.push('numbers');
      }
      if (options.includeSymbols && usedCounts.symbols < limits.symbols.max) {
        availableTypes.push('symbols');
      }

      if (availableTypes.length === 0) {
        // If all types are at max, use all enabled types
        if (options.includeUppercase) availableTypes.push('uppercase');
        if (options.includeLowercase) availableTypes.push('lowercase');
        if (options.includeNumbers) availableTypes.push('numbers');
        if (options.includeSymbols) availableTypes.push('symbols');
      }

      if (availableTypes.length > 0) {
        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        
        let charset = '';
        switch (randomType) {
          case 'uppercase':
            charset = characterSets.uppercase;
            usedCounts.uppercase++;
            break;
          case 'lowercase':
            charset = characterSets.lowercase;
            usedCounts.lowercase++;
            break;
          case 'numbers':
            charset = characterSets.numbers;
            usedCounts.numbers++;
            break;
          case 'symbols':
            let symbolSet = '';
            Object.entries(options.symbolCategories).forEach(([category, enabled]) => {
              if (enabled && characterSets.symbols[category]) {
                symbolSet += characterSets.symbols[category];
              }
            });
            if (options.customSymbols) {
              symbolSet += options.customSymbols;
            }
            charset = symbolSet;
            usedCounts.symbols++;
            break;
        }

        // Apply exclusions
        if (options.excludeSimilar) {
          charset = charset.split('').filter(char => !characterSets.similar.includes(char)).join('');
        }
        if (randomType === 'symbols' && options.excludeAmbiguous) {
          charset = charset.split('').filter(char => !characterSets.ambiguous.includes(char)).join('');
        }

        if (charset) {
          password += getRandomChar(charset);
        }
      }
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    return password;
  };

  const generatePasswordWithCounts = () => {
    const counts = options.characterCounts;
    const totalRequiredChars = counts.uppercase + counts.lowercase + counts.numbers + counts.symbols;
    
    if (totalRequiredChars > options.length) {
      alert(`Total character count (${totalRequiredChars}) exceeds password length (${options.length})`);
      return '';
    }

    let password = '';
    let remainingLength = options.length;

    // Generate specific counts of each character type
    if (counts.uppercase > 0 && options.includeUppercase) {
      let charset = characterSets.uppercase;
      if (options.excludeSimilar) {
        charset = charset.split('').filter(char => !characterSets.similar.includes(char)).join('');
      }
      for (let i = 0; i < counts.uppercase; i++) {
        password += getRandomChar(charset);
      }
      remainingLength -= counts.uppercase;
    }

    if (counts.lowercase > 0 && options.includeLowercase) {
      let charset = characterSets.lowercase;
      if (options.excludeSimilar) {
        charset = charset.split('').filter(char => !characterSets.similar.includes(char)).join('');
      }
      for (let i = 0; i < counts.lowercase; i++) {
        password += getRandomChar(charset);
      }
      remainingLength -= counts.lowercase;
    }

    if (counts.numbers > 0 && options.includeNumbers) {
      let charset = characterSets.numbers;
      if (options.excludeSimilar) {
        charset = charset.split('').filter(char => !characterSets.similar.includes(char)).join('');
      }
      for (let i = 0; i < counts.numbers; i++) {
        password += getRandomChar(charset);
      }
      remainingLength -= counts.numbers;
    }

    if (counts.symbols > 0 && options.includeSymbols) {
      let symbolSet = '';
      Object.entries(options.symbolCategories).forEach(([category, enabled]) => {
        if (enabled && characterSets.symbols[category]) {
          symbolSet += characterSets.symbols[category];
        }
      });
      
      if (options.customSymbols) {
        symbolSet += options.customSymbols;
      }

      if (options.excludeAmbiguous) {
        symbolSet = symbolSet.split('').filter(char => !characterSets.ambiguous.includes(char)).join('');
      }

      for (let i = 0; i < counts.symbols; i++) {
        password += getRandomChar(symbolSet);
      }
      remainingLength -= counts.symbols;
    }

    // Fill remaining length with random characters from all enabled sets
    if (remainingLength > 0) {
      let allCharset = '';
      if (options.includeUppercase) allCharset += characterSets.uppercase;
      if (options.includeLowercase) allCharset += characterSets.lowercase;
      if (options.includeNumbers) allCharset += characterSets.numbers;
      
      if (options.includeSymbols) {
        let symbolSet = '';
        Object.entries(options.symbolCategories).forEach(([category, enabled]) => {
          if (enabled && characterSets.symbols[category]) {
            symbolSet += characterSets.symbols[category];
          }
        });
        if (options.customSymbols) {
          symbolSet += options.customSymbols;
        }
        allCharset += symbolSet;
      }

      // Apply exclusions
      if (options.excludeSimilar) {
        allCharset = allCharset.split('').filter(char => !characterSets.similar.includes(char)).join('');
      }
      if (options.excludeAmbiguous) {
        allCharset = allCharset.split('').filter(char => !characterSets.ambiguous.includes(char)).join('');
      }

      for (let i = 0; i < remainingLength; i++) {
        password += getRandomChar(allCharset);
      }
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    return password;
  };

  const generatePasswordTraditional = () => {
    let charset = '';
    
    // Build character set based on options
    if (options.includeUppercase) charset += characterSets.uppercase;
    if (options.includeLowercase) charset += characterSets.lowercase;
    if (options.includeNumbers) charset += characterSets.numbers;
    
    // Add symbols based on selected categories
    if (options.includeSymbols) {
      let symbolSet = '';
      Object.entries(options.symbolCategories).forEach(([category, enabled]) => {
        if (enabled && characterSets.symbols[category]) {
          symbolSet += characterSets.symbols[category];
        }
      });
      
      // Add custom symbols if provided
      if (options.customSymbols) {
        symbolSet += options.customSymbols;
      }
      
      charset += symbolSet;
    }
    
    // Remove similar characters if requested
    if (options.excludeSimilar) {
      charset = charset.split('').filter(char => !characterSets.similar.includes(char)).join('');
    }
    
    // Remove ambiguous characters if requested
    if (options.excludeAmbiguous) {
      charset = charset.split('').filter(char => !characterSets.ambiguous.includes(char)).join('');
    }
    
    if (charset.length === 0) {
      alert('Please select at least one character type');
      return '';
    }
    
    let password = '';
    
    // Ensure at least one character from each selected type
    const requiredChars = [];
    if (options.includeUppercase) requiredChars.push(getRandomChar(characterSets.uppercase));
    if (options.includeLowercase) requiredChars.push(getRandomChar(characterSets.lowercase));
    if (options.includeNumbers) requiredChars.push(getRandomChar(characterSets.numbers));
    
    if (options.includeSymbols) {
      let symbolSet = '';
      Object.entries(options.symbolCategories).forEach(([category, enabled]) => {
        if (enabled && characterSets.symbols[category]) {
          symbolSet += characterSets.symbols[category];
        }
      });
      if (options.customSymbols) {
        symbolSet += options.customSymbols;
      }
      if (symbolSet) {
        requiredChars.push(getRandomChar(symbolSet));
      }
    }
    
    // Fill the rest randomly
    for (let i = 0; i < options.length - requiredChars.length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Add required characters
    password += requiredChars.join('');
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    return password;
  };

  const getRandomChar = (charset) => {
    return charset.charAt(Math.floor(Math.random() * charset.length));
  };

  const handleGenerate = () => {
    const newPassword = generatePassword();
    setGeneratedPassword(newPassword);
    onPasswordGenerated(newPassword);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleSymbolCategoryChange = (category, enabled) => {
    setOptions(prev => ({
      ...prev,
      symbolCategories: {
        ...prev.symbolCategories,
        [category]: enabled
      }
    }));
  };

  const handleCharacterCountChange = (type, value) => {
    const newValue = Math.max(0, Math.min(options.length, parseInt(value) || 0));
    setOptions(prev => ({
      ...prev,
      characterCounts: {
        ...prev.characterCounts,
        [type]: newValue
      }
    }));
  };

  const handleMinMaxChange = (type, limit, value) => {
    const newValue = Math.max(0, Math.min(options.length, parseInt(value) || 0));
    setOptions(prev => ({
      ...prev,
      minMaxLimits: {
        ...prev.minMaxLimits,
        [type]: {
          ...prev.minMaxLimits[type],
          [limit]: newValue
        }
      }
    }));
  };

  const autoDistributeCharacters = () => {
    const activeTypes = [];
    if (options.includeUppercase) activeTypes.push('uppercase');
    if (options.includeLowercase) activeTypes.push('lowercase');
    if (options.includeNumbers) activeTypes.push('numbers');
    if (options.includeSymbols) activeTypes.push('symbols');

    if (activeTypes.length === 0) return;

    const baseCount = Math.floor(options.length / activeTypes.length);
    const remainder = options.length % activeTypes.length;
    
    const newCounts = {
      uppercase: 0,
      lowercase: 0,
      numbers: 0,
      symbols: 0
    };

    activeTypes.forEach((type, index) => {
      newCounts[type] = baseCount + (index < remainder ? 1 : 0);
    });

    setOptions(prev => ({
      ...prev,
      characterCounts: newCounts
    }));
  };

  const autoSetMinMaxLimits = () => {
    const activeTypes = [];
    if (options.includeUppercase) activeTypes.push('uppercase');
    if (options.includeLowercase) activeTypes.push('lowercase');
    if (options.includeNumbers) activeTypes.push('numbers');
    if (options.includeSymbols) activeTypes.push('symbols');

    if (activeTypes.length === 0) return;

    const newLimits = {
      uppercase: { min: 0, max: Math.floor(options.length / 2) },
      lowercase: { min: 0, max: Math.floor(options.length / 2) },
      numbers: { min: 0, max: Math.floor(options.length / 3) },
      symbols: { min: 0, max: Math.floor(options.length / 4) }
    };

    // Set minimum to 1 for active types
    activeTypes.forEach(type => {
      newLimits[type].min = 1;
    });

    setOptions(prev => ({
      ...prev,
      minMaxLimits: newLimits
    }));
  };

  const getPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');
    
    if (password.length >= 12) score += 1;
    else if (password.length >= 8) feedback.push('Consider using 12+ characters');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');
    
    const strength = score <= 2 ? 'Weak' : score <= 4 ? 'Medium' : 'Strong';
    const color = score <= 2 ? 'red' : score <= 4 ? 'yellow' : 'green';
    
    return { strength, color, score, feedback };
  };

  const analyzePasswordComposition = (password) => {
    if (!password) return null;

    const counts = {
      uppercase: (password.match(/[A-Z]/g) || []).length,
      lowercase: (password.match(/[a-z]/g) || []).length,
      numbers: (password.match(/[0-9]/g) || []).length,
      symbols: (password.match(/[^A-Za-z0-9]/g) || []).length
    };

    return counts;
  };

  // Function to render password with color-coded characters
  const renderColoredPassword = (password) => {
    if (!password) return '';
    
    return password.split('').map((char, index) => {
      let colorClass = 'text-slate-300'; // Default for lowercase
      
      if (/[A-Z]/.test(char)) {
        colorClass = 'text-green-400'; // Uppercase - Green
      } else if (/[0-9]/.test(char)) {
        colorClass = 'text-blue-400'; // Numbers - Blue
      } else if (/[^A-Za-z0-9]/.test(char)) {
        colorClass = 'text-red-400'; // Symbols - Red
      }
      
      return (
        <span key={index} className={colorClass}>
          {char}
        </span>
      );
    });
  };

  const passwordStrength = generatedPassword ? getPasswordStrength(generatedPassword) : null;
  const passwordComposition = analyzePasswordComposition(generatedPassword);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Generate Button */}
      <div className="flex space-x-3">
        <button
          onClick={handleGenerate}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200"
        >
          <SafeIcon icon={FiKey} className="text-sm" />
          <span>Generate Password</span>
        </button>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
        >
          <SafeIcon icon={FiSettings} className="text-sm" />
          <span>Options</span>
        </button>
      </div>

      {/* Password Options Panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-700/50 border border-slate-600 rounded-xl p-6 space-y-4"
        >
          <h3 className="text-lg font-medium text-white mb-4">Password Options</h3>
          
          {/* Password Length */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Password Length: {options.length}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="8"
                max="128"
                value={options.length}
                onChange={(e) => setOptions(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                min="8"
                max="128"
                value={options.length}
                onChange={(e) => setOptions(prev => ({ ...prev, length: parseInt(e.target.value) || 8 }))}
                className="w-20 px-3 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
              />
            </div>
          </div>

          {/* Character Types */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Character Types</label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeUppercase}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeUppercase: e.target.checked }))}
                  className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                />
                <span className="text-slate-300">Uppercase (A-Z) - <span className="text-green-400">Green</span></span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeLowercase}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeLowercase: e.target.checked }))}
                  className="w-4 h-4 text-slate-600 bg-slate-700 border-slate-600 rounded focus:ring-slate-500"
                />
                <span className="text-slate-300">Lowercase (a-z) - <span className="text-slate-400">Default</span></span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeNumbers}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeNumbers: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="text-slate-300">Numbers (0-9) - <span className="text-blue-400">Blue</span></span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeSymbols}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeSymbols: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                />
                <span className="text-slate-300">Symbols - <span className="text-red-400">Red</span></span>
              </label>
            </div>
          </div>

          {/* Generation Mode Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Generation Mode</label>
            
            <div className="grid grid-cols-1 gap-3">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="generationMode"
                  checked={!options.useSpecificCounts && !options.useMinMaxLimits}
                  onChange={() => setOptions(prev => ({ ...prev, useSpecificCounts: false, useMinMaxLimits: false }))}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                />
                <span className="text-slate-300">Traditional (at least 1 of each type)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="generationMode"
                  checked={options.useSpecificCounts}
                  onChange={() => setOptions(prev => ({ ...prev, useSpecificCounts: true, useMinMaxLimits: false }))}
                  className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 focus:ring-purple-500"
                />
                <span className="text-slate-300">Exact character counts</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="generationMode"
                  checked={options.useMinMaxLimits}
                  onChange={() => setOptions(prev => ({ ...prev, useSpecificCounts: false, useMinMaxLimits: true }))}
                  className="w-4 h-4 text-orange-600 bg-slate-700 border-slate-600 focus:ring-orange-500"
                />
                <span className="text-slate-300">Min/Max character limits</span>
              </label>
            </div>
          </div>

          {/* Min/Max Controls */}
          {options.useMinMaxLimits && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 space-y-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300">Min/Max Character Limits</span>
                <button
                  onClick={autoSetMinMaxLimits}
                  className="flex items-center space-x-1 px-2 py-1 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/30 rounded text-orange-400 text-xs transition-colors"
                >
                  <SafeIcon icon={FiSliders} className="text-xs" />
                  <span>Auto Set</span>
                </button>
              </div>

              <div className="space-y-4">
                {options.includeUppercase && (
                  <div className="space-y-2">
                    <label className="block text-sm text-green-400">Uppercase Letters (Green)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="0"
                          max={options.length}
                          value={options.minMaxLimits.uppercase.min}
                          onChange={(e) => handleMinMaxChange('uppercase', 'min', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="0"
                          max={options.length}
                          value={options.minMaxLimits.uppercase.max}
                          onChange={(e) => handleMinMaxChange('uppercase', 'max', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {options.includeLowercase && (
                  <div className="space-y-2">
                    <label className="block text-sm text-slate-400">Lowercase Letters (Default)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="0"
                          max={options.length}
                          value={options.minMaxLimits.lowercase.min}
                          onChange={(e) => handleMinMaxChange('lowercase', 'min', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="0"
                          max={options.length}
                          value={options.minMaxLimits.lowercase.max}
                          onChange={(e) => handleMinMaxChange('lowercase', 'max', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {options.includeNumbers && (
                  <div className="space-y-2">
                    <label className="block text-sm text-blue-400">Numbers (Blue)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="0"
                          max={options.length}
                          value={options.minMaxLimits.numbers.min}
                          onChange={(e) => handleMinMaxChange('numbers', 'min', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="0"
                          max={options.length}
                          value={options.minMaxLimits.numbers.max}
                          onChange={(e) => handleMinMaxChange('numbers', 'max', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {options.includeSymbols && (
                  <div className="space-y-2">
                    <label className="block text-sm text-red-400">Symbols (Red)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="0"
                          max={options.length}
                          value={options.minMaxLimits.symbols.min}
                          onChange={(e) => handleMinMaxChange('symbols', 'min', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="0"
                          max={options.length}
                          value={options.minMaxLimits.symbols.max}
                          onChange={(e) => handleMinMaxChange('symbols', 'max', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Min/Max Summary */}
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                <h5 className="text-sm font-medium text-slate-300 mb-2">Character Limits Summary</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {options.includeUppercase && (
                    <div className="flex items-center justify-between">
                      <span className="text-green-400">Uppercase:</span>
                      <span className="text-slate-300">{options.minMaxLimits.uppercase.min}-{options.minMaxLimits.uppercase.max}</span>
                    </div>
                  )}
                  {options.includeLowercase && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Lowercase:</span>
                      <span className="text-slate-300">{options.minMaxLimits.lowercase.min}-{options.minMaxLimits.lowercase.max}</span>
                    </div>
                  )}
                  {options.includeNumbers && (
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400">Numbers:</span>
                      <span className="text-slate-300">{options.minMaxLimits.numbers.min}-{options.minMaxLimits.numbers.max}</span>
                    </div>
                  )}
                  {options.includeSymbols && (
                    <div className="flex items-center justify-between">
                      <span className="text-red-400">Symbols:</span>
                      <span className="text-slate-300">{options.minMaxLimits.symbols.min}-{options.minMaxLimits.symbols.max}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Character Count Control */}
          {options.useSpecificCounts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 space-y-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300">Exact Character Counts</span>
                <button
                  onClick={autoDistributeCharacters}
                  className="flex items-center space-x-1 px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 rounded text-purple-400 text-xs transition-colors"
                >
                  <SafeIcon icon={FiTarget} className="text-xs" />
                  <span>Auto Distribute</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.includeUppercase && (
                  <div className="space-y-2">
                    <label className="block text-sm text-green-400">Uppercase Letters (Green)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max={options.length}
                        value={options.characterCounts.uppercase}
                        onChange={(e) => handleCharacterCountChange('uppercase', e.target.value)}
                        className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max={options.length}
                        value={options.characterCounts.uppercase}
                        onChange={(e) => handleCharacterCountChange('uppercase', e.target.value)}
                        className="w-16 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                    </div>
                  </div>
                )}

                {options.includeLowercase && (
                  <div className="space-y-2">
                    <label className="block text-sm text-slate-400">Lowercase Letters (Default)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max={options.length}
                        value={options.characterCounts.lowercase}
                        onChange={(e) => handleCharacterCountChange('lowercase', e.target.value)}
                        className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max={options.length}
                        value={options.characterCounts.lowercase}
                        onChange={(e) => handleCharacterCountChange('lowercase', e.target.value)}
                        className="w-16 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                    </div>
                  </div>
                )}

                {options.includeNumbers && (
                  <div className="space-y-2">
                    <label className="block text-sm text-blue-400">Numbers (Blue)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max={options.length}
                        value={options.characterCounts.numbers}
                        onChange={(e) => handleCharacterCountChange('numbers', e.target.value)}
                        className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max={options.length}
                        value={options.characterCounts.numbers}
                        onChange={(e) => handleCharacterCountChange('numbers', e.target.value)}
                        className="w-16 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                    </div>
                  </div>
                )}

                {options.includeSymbols && (
                  <div className="space-y-2">
                    <label className="block text-sm text-red-400">Symbols (Red)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max={options.length}
                        value={options.characterCounts.symbols}
                        onChange={(e) => handleCharacterCountChange('symbols', e.target.value)}
                        className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max={options.length}
                        value={options.characterCounts.symbols}
                        onChange={(e) => handleCharacterCountChange('symbols', e.target.value)}
                        className="w-16 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Count Summary */}
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Total Characters:</span>
                  <span className={`font-medium ${
                    (options.characterCounts.uppercase + options.characterCounts.lowercase + 
                     options.characterCounts.numbers + options.characterCounts.symbols) > options.length
                      ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {options.characterCounts.uppercase + options.characterCounts.lowercase + 
                     options.characterCounts.numbers + options.characterCounts.symbols} / {options.length}
                  </span>
                </div>
                {(options.characterCounts.uppercase + options.characterCounts.lowercase + 
                  options.characterCounts.numbers + options.characterCounts.symbols) > options.length && (
                  <p className="text-xs text-red-400 mt-1">
                    Warning: Character count exceeds password length
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Symbol Selection */}
          {options.includeSymbols && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-300">Symbol Categories</label>
                <button
                  onClick={() => setShowSymbolOptions(!showSymbolOptions)}
                  className="flex items-center space-x-1 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <span>Customize</span>
                  <SafeIcon icon={showSymbolOptions ? FiChevronUp : FiChevronDown} className="text-xs" />
                </button>
              </div>
              
              {showSymbolOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 space-y-3"
                >
                  <div className="grid grid-cols-1 gap-3">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={options.symbolCategories.basic}
                          onChange={(e) => handleSymbolCategoryChange('basic', e.target.checked)}
                          className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                        />
                        <span className="text-slate-300">Basic Symbols</span>
                      </div>
                      <code className="text-xs text-red-400 bg-slate-700 px-2 py-1 rounded">
                        {characterSets.symbols.basic}
                      </code>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={options.symbolCategories.brackets}
                          onChange={(e) => handleSymbolCategoryChange('brackets', e.target.checked)}
                          className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                        />
                        <span className="text-slate-300">Brackets</span>
                      </div>
                      <code className="text-xs text-red-400 bg-slate-700 px-2 py-1 rounded">
                        {characterSets.symbols.brackets}
                      </code>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={options.symbolCategories.punctuation}
                          onChange={(e) => handleSymbolCategoryChange('punctuation', e.target.checked)}
                          className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                        />
                        <span className="text-slate-300">Punctuation</span>
                      </div>
                      <code className="text-xs text-red-400 bg-slate-700 px-2 py-1 rounded">
                        {characterSets.symbols.punctuation}
                      </code>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={options.symbolCategories.math}
                          onChange={(e) => handleSymbolCategoryChange('math', e.target.checked)}
                          className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                        />
                        <span className="text-slate-300">Math Symbols</span>
                      </div>
                      <code className="text-xs text-red-400 bg-slate-700 px-2 py-1 rounded">
                        {characterSets.symbols.math}
                      </code>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={options.symbolCategories.special}
                          onChange={(e) => handleSymbolCategoryChange('special', e.target.checked)}
                          className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                        />
                        <span className="text-slate-300">Special Characters</span>
                      </div>
                      <code className="text-xs text-red-400 bg-slate-700 px-2 py-1 rounded">
                        {characterSets.symbols.special}
                      </code>
                    </label>
                  </div>
                  
                  {/* Custom Symbols */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Custom Symbols
                    </label>
                    <input
                      type="text"
                      value={options.customSymbols}
                      onChange={(e) => setOptions(prev => ({ ...prev, customSymbols: e.target.value }))}
                      placeholder="Add your own symbols..."
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-slate-400">
                      Enter any additional symbols you want to include
                    </p>
                  </div>
                  
                  {/* Quick Symbol Presets */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setOptions(prev => ({
                        ...prev,
                        symbolCategories: {
                          basic: true,
                          brackets: false,
                          punctuation: false,
                          math: false,
                          special: false
                        }
                      }))}
                      className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded text-blue-400 text-xs transition-colors"
                    >
                      Basic Only
                    </button>
                    <button
                      onClick={() => setOptions(prev => ({
                        ...prev,
                        symbolCategories: {
                          basic: true,
                          brackets: true,
                          punctuation: true,
                          math: true,
                          special: false
                        }
                      }))}
                      className="px-2 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 rounded text-green-400 text-xs transition-colors"
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setOptions(prev => ({
                        ...prev,
                        symbolCategories: {
                          basic: true,
                          brackets: true,
                          punctuation: true,
                          math: true,
                          special: true
                        }
                      }))}
                      className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 rounded text-purple-400 text-xs transition-colors"
                    >
                      All Symbols
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Advanced Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Advanced Options</label>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.excludeSimilar}
                  onChange={(e) => setOptions(prev => ({ ...prev, excludeSimilar: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                />
                <span className="text-slate-300">Exclude similar characters (i, l, 1, L, o, 0, O)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.excludeAmbiguous}
                  onChange={(e) => setOptions(prev => ({ ...prev, excludeAmbiguous: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                />
                <span className="text-slate-300">Exclude ambiguous characters</span>
              </label>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setOptions({
                  length: 12,
                  includeUppercase: true,
                  includeLowercase: true,
                  includeNumbers: true,
                  includeSymbols: false,
                  excludeSimilar: false,
                  excludeAmbiguous: false,
                  symbolCategories: {
                    basic: true,
                    brackets: true,
                    punctuation: true,
                    math: true,
                    special: false
                  },
                  customSymbols: '',
                  useSpecificCounts: false,
                  useMinMaxLimits: false,
                  characterCounts: {
                    uppercase: 2,
                    lowercase: 8,
                    numbers: 2,
                    symbols: 0
                  },
                  minMaxLimits: {
                    uppercase: { min: 1, max: 8 },
                    lowercase: { min: 1, max: 12 },
                    numbers: { min: 1, max: 6 },
                    symbols: { min: 0, max: 0 }
                  }
                })}
                className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded text-blue-400 text-sm transition-colors"
              >
                Basic (12 chars)
              </button>
              <button
                onClick={() => setOptions({
                  length: 16,
                  includeUppercase: true,
                  includeLowercase: true,
                  includeNumbers: true,
                  includeSymbols: true,
                  excludeSimilar: false,
                  excludeAmbiguous: false,
                  symbolCategories: {
                    basic: true,
                    brackets: true,
                    punctuation: true,
                    math: true,
                    special: false
                  },
                  customSymbols: '',
                  useSpecificCounts: false,
                  useMinMaxLimits: true,
                  characterCounts: {
                    uppercase: 3,
                    lowercase: 8,
                    numbers: 3,
                    symbols: 2
                  },
                  minMaxLimits: {
                    uppercase: { min: 2, max: 6 },
                    lowercase: { min: 4, max: 10 },
                    numbers: { min: 2, max: 4 },
                    symbols: { min: 1, max: 3 }
                  }
                })}
                className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 rounded text-green-400 text-sm transition-colors"
              >
                Strong (16 chars)
              </button>
              <button
                onClick={() => setOptions({
                  length: 32,
                  includeUppercase: true,
                  includeLowercase: true,
                  includeNumbers: true,
                  includeSymbols: true,
                  excludeSimilar: true,
                  excludeAmbiguous: true,
                  symbolCategories: {
                    basic: true,
                    brackets: true,
                    punctuation: true,
                    math: true,
                    special: true
                  },
                  customSymbols: '',
                  useSpecificCounts: false,
                  useMinMaxLimits: true,
                  characterCounts: {
                    uppercase: 6,
                    lowercase: 16,
                    numbers: 6,
                    symbols: 4
                  },
                  minMaxLimits: {
                    uppercase: { min: 4, max: 10 },
                    lowercase: { min: 8, max: 20 },
                    numbers: { min: 4, max: 8 },
                    symbols: { min: 2, max: 6 }
                  }
                })}
                className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 rounded text-purple-400 text-sm transition-colors"
              >
                Maximum (32 chars)
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Generated Password Display */}
      {generatedPassword && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-white">Generated Password</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
              >
                <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="text-sm" />
              </button>
              <button
                onClick={handleGenerate}
                className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
              >
                <SafeIcon icon={FiRefreshCw} className="text-sm" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                <code className="text-white font-mono text-sm break-all">
                  {showPassword ? renderColoredPassword(generatedPassword) : '•'.repeat(generatedPassword.length)}
                </code>
              </div>
              <button
                onClick={copyToClipboard}
                className="p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
              >
                <SafeIcon icon={copied ? FiCheck : FiCopy} className="text-sm" />
              </button>
            </div>
          </div>

          {/* Color Legend */}
          <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3">
            <h5 className="text-sm font-medium text-slate-300 mb-2">Color Legend</h5>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-green-400">■</span>
                <span className="text-slate-400">Uppercase (A-Z)</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">■</span>
                <span className="text-slate-400">Lowercase (a-z)</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-blue-400">■</span>
                <span className="text-slate-400">Numbers (0-9)</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-red-400">■</span>
                <span className="text-slate-400">Symbols</span>
              </div>
            </div>
          </div>

          {/* Password Composition Analysis */}
          {passwordComposition && (
            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3">
              <h5 className="text-sm font-medium text-slate-300 mb-2">Character Composition</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Uppercase:</span>
                  <span className="text-green-400 font-medium">{passwordComposition.uppercase}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Lowercase:</span>
                  <span className="text-slate-400 font-medium">{passwordComposition.lowercase}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Numbers:</span>
                  <span className="text-blue-400 font-medium">{passwordComposition.numbers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Symbols:</span>
                  <span className="text-red-400 font-medium">{passwordComposition.symbols}</span>
                </div>
              </div>
            </div>
          )}

          {/* Password Strength Indicator */}
          {passwordStrength && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Strength:</span>
                <span className={`text-sm font-medium ${
                  passwordStrength.color === 'red' ? 'text-red-400' :
                  passwordStrength.color === 'yellow' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {passwordStrength.strength}
                </span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordStrength.color === 'red' ? 'bg-red-500' :
                    passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                />
              </div>
              {passwordStrength.feedback.length > 0 && (
                <div className="text-xs text-slate-400">
                  <p>Suggestions: {passwordStrength.feedback.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {copied && (
            <div className="text-sm text-green-400">
              Password copied to clipboard!
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default PasswordGenerator;