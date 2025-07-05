import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiKey, FiCheck, FiX, FiLoader, FiShield, FiAlertTriangle, FiInfo } = FiIcons;

const YubiKeyAuth = ({ onAuthSuccess, onAuthError, isRequired = false }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState('idle'); // idle, connecting, authenticated, error
  const [errorMessage, setErrorMessage] = useState('');
  const [yubiKeyInfo, setYubiKeyInfo] = useState(null);

  useEffect(() => {
    checkWebAuthnSupport();
  }, []);

  const checkWebAuthnSupport = async () => {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        setErrorMessage('WebAuthn is not supported in this browser');
        setIsSupported(false);
        return;
      }

      // Check if conditional mediation is available (optional)
      const conditionalMediationAvailable = await PublicKeyCredential.isConditionalMediationAvailable?.() || false;
      
      setIsSupported(true);
      console.log('WebAuthn supported, conditional mediation:', conditionalMediationAvailable);
    } catch (error) {
      console.error('Error checking WebAuthn support:', error);
      setErrorMessage('Failed to check hardware key support');
      setIsSupported(false);
    }
  };

  const authenticateWithYubiKey = async () => {
    if (!isSupported) {
      setErrorMessage('WebAuthn not supported in this browser');
      return;
    }

    setIsAuthenticating(true);
    setAuthStatus('connecting');
    setErrorMessage('');

    try {
      // Generate a random challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Create a unique user ID
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      // Create credential options
      const createCredentialOptions = {
        challenge: challenge,
        rp: {
          name: 'SecureVault',
          id: window.location.hostname
        },
        user: {
          id: userId,
          name: 'securevault-user',
          displayName: 'SecureVault User'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'cross-platform',
          userVerification: 'preferred',
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: 'none'
      };

      // Request credential creation
      const credential = await navigator.credentials.create({
        publicKey: createCredentialOptions
      });

      if (credential) {
        setAuthStatus('authenticated');
        setYubiKeyInfo({
          id: credential.id,
          type: credential.type,
          authenticatorAttachment: credential.authenticatorAttachment || 'cross-platform'
        });
        
        // Generate hardware-based key for encryption
        const hardwareKey = await generateHardwareKey(credential);
        onAuthSuccess(hardwareKey);
      }
    } catch (error) {
      console.error('YubiKey authentication failed:', error);
      setAuthStatus('error');
      
      if (error.name === 'NotAllowedError') {
        setErrorMessage('Authentication was cancelled or denied');
      } else if (error.name === 'NotSupportedError') {
        setErrorMessage('Hardware key authentication not supported');
      } else if (error.name === 'SecurityError') {
        setErrorMessage('Security error - please ensure you are using HTTPS');
      } else if (error.name === 'InvalidStateError') {
        setErrorMessage('Invalid state - please try again');
      } else {
        setErrorMessage('Authentication failed: ' + error.message);
      }
      
      onAuthError(error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const generateHardwareKey = async (credential) => {
    try {
      // Use the credential ID and response to generate a consistent key
      const credentialId = new Uint8Array(credential.rawId);
      const response = credential.response;
      
      // Get the attestation object
      const attestationObject = new Uint8Array(response.attestationObject);
      
      // Combine credential data for key generation
      const combinedData = new Uint8Array(credentialId.length + attestationObject.length);
      combinedData.set(credentialId);
      combinedData.set(attestationObject, credentialId.length);
      
      // Generate a salt for this specific key
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // Import the combined data as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        combinedData,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      
      // Derive the final encryption key
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      return { key, salt };
    } catch (error) {
      console.error('Error generating hardware key:', error);
      throw new Error('Failed to generate hardware key');
    }
  };

  const resetAuth = () => {
    setAuthStatus('idle');
    setErrorMessage('');
    setYubiKeyInfo(null);
  };

  if (!isSupported) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-700/50 border border-slate-600 rounded-xl p-6"
      >
        <div className="flex items-start space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <SafeIcon icon={FiInfo} className="text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-yellow-400 font-medium">Hardware Key Not Available</p>
            <p className="text-slate-300 mt-1">
              WebAuthn is not supported in this browser or environment. Hardware key authentication is disabled.
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Try using a modern browser with HTTPS for hardware key support.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-700/50 border border-slate-600 rounded-xl p-6"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-2 rounded-lg ${
          authStatus === 'authenticated' ? 'bg-green-500/20 text-green-400' :
          authStatus === 'error' ? 'bg-red-500/20 text-red-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          <SafeIcon icon={FiShield} className="text-lg" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Hardware Key Authentication</h3>
          <p className="text-sm text-slate-400">
            {isRequired ? 'Required for encryption' : 'Optional additional security'}
          </p>
        </div>
      </div>

      {authStatus === 'idle' && (
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <SafeIcon icon={FiKey} className="text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-400 font-medium">Hardware Key Benefits:</p>
              <ul className="text-slate-300 mt-1 space-y-1">
                <li>• Phishing-resistant authentication</li>
                <li>• Hardware-backed encryption keys</li>
                <li>• Enhanced security for sensitive files</li>
                <li>• Works with YubiKey, TouchID, Windows Hello</li>
              </ul>
            </div>
          </div>

          <button
            onClick={authenticateWithYubiKey}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isAuthenticating ? (
              <>
                <SafeIcon icon={FiLoader} className="text-lg animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <SafeIcon icon={FiKey} className="text-lg" />
                <span>Authenticate with Hardware Key</span>
              </>
            )}
          </button>
        </div>
      )}

      {authStatus === 'connecting' && (
        <div className="text-center py-4">
          <div className="animate-pulse">
            <SafeIcon icon={FiLoader} className="text-3xl text-blue-400 mx-auto mb-2 animate-spin" />
            <p className="text-white font-medium">Touch your hardware key...</p>
            <p className="text-sm text-slate-400 mt-1">
              Follow the prompts on your device or browser
            </p>
          </div>
        </div>
      )}

      {authStatus === 'authenticated' && yubiKeyInfo && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <SafeIcon icon={FiCheck} className="text-green-400" />
            <div>
              <p className="text-green-400 font-medium">Hardware Key Authenticated</p>
              <p className="text-sm text-slate-400">Ready for secure encryption</p>
            </div>
          </div>

          <div className="text-sm text-slate-300">
            <p><strong>Key ID:</strong> {yubiKeyInfo.id.substring(0, 16)}...</p>
            <p><strong>Type:</strong> {yubiKeyInfo.type}</p>
            <p><strong>Attachment:</strong> {yubiKeyInfo.authenticatorAttachment}</p>
          </div>

          <button
            onClick={resetAuth}
            className="w-full px-4 py-2 bg-slate-600/50 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            Use Different Key
          </button>
        </div>
      )}

      {authStatus === 'error' && (
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <SafeIcon icon={FiAlertTriangle} className="text-red-400 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Authentication Failed</p>
              <p className="text-sm text-slate-300 mt-1">{errorMessage}</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={authenticateWithYubiKey}
              className="flex-1 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={resetAuth}
              className="flex-1 px-4 py-2 bg-slate-600/50 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default YubiKeyAuth;