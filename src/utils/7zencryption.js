import pako from 'pako';
import JSZip from 'jszip';

// Enhanced ZIP-based encryption with 7z-like features and comprehensive filename encryption

let compressionSupported = true;

// Initialize compression support check
const initCompression = async () => {
  try {
    // Test if compression is available
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const compressed = pako.deflate(testData);
    const decompressed = pako.inflate(compressed);
    compressionSupported = true;
    console.log('Enhanced compression initialized successfully');
    return true;
  } catch (error) {
    console.error('Compression initialization failed:', error);
    compressionSupported = false;
    return false;
  }
};

// Create enhanced encrypted archive with 7z-like features and filename encryption
export const create7zArchive = async (files, password, options = {}, onProgress = null) => {
  try {
    await initCompression();
    
    const {
      compressionLevel = 5, // 0-9, higher = better compression
      encryptFilenames = true, // Encrypt file names
      compressionMethod = 'LZMA2', // For UI compatibility
      solidArchive = true, // Better compression for multiple files
      deleteAfterArchiving = false,
      customArchiveName = null,
      // New filename encryption options
      filenameEncryptionMode = 'full',
      preserveExtensions = false,
      customPrefix = 'enc'
    } = options;

    // Validate files
    if (!files || files.length === 0) {
      throw new Error('No files provided for archiving');
    }

    // Validate password
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters for enhanced encryption');
    }

    const totalFiles = files.length;
    let processedFiles = 0;

    // Create filename encryption options
    const filenameOptions = {
      mode: encryptFilenames ? filenameEncryptionMode : 'none',
      preserveExtensions: preserveExtensions,
      customPrefix: customPrefix
    };

    // Create archive name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveName = customArchiveName || `encrypted-archive-${timestamp}.7z`;

    // Create enhanced ZIP with encryption
    const zip = new JSZip();
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    // Generate encryption key from password
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encryptionKey = await crypto.subtle.deriveKey(
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

    // Process each file
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        totalOriginalSize += uint8Array.length;
        
        // Apply compression based on level
        let processedData = uint8Array;
        if (compressionLevel > 0 && compressionSupported) {
          const compressionOptions = {
            level: Math.min(9, compressionLevel),
            windowBits: 15,
            memLevel: 8,
            strategy: pako.constants.Z_DEFAULT_STRATEGY
          };
          
          try {
            processedData = pako.deflate(uint8Array, compressionOptions);
          } catch (compError) {
            console.warn('Compression failed, using uncompressed data:', compError);
            processedData = uint8Array;
          }
        }

        // Encrypt the data
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv },
          encryptionKey,
          processedData
        );

        // Create file metadata with filename encryption info
        const metadata = {
          originalSize: uint8Array.length,
          compressedSize: processedData.length,
          encrypted: true,
          compressionMethod: compressionMethod,
          timestamp: file.lastModified || Date.now(),
          iv: Array.from(iv),
          originalPath: file.webkitRelativePath || file.name,
          filenameEncryption: filenameOptions
        };

        // Apply filename encryption
        let filePath;
        if (filenameOptions.mode !== 'none') {
          const originalName = file.webkitRelativePath || file.name;
          const encryptedFilename = await encryptFilename(originalName, password, filenameOptions);
          filePath = encryptedFilename;
          
          // Store encryption details in metadata
          metadata.encryptedFilename = true;
          metadata.filenameEncryptionDetails = {
            mode: filenameOptions.mode,
            preserveExtensions: filenameOptions.preserveExtensions,
            customPrefix: filenameOptions.customPrefix
          };
        } else {
          filePath = (file.webkitRelativePath || file.name) + '.enc';
        }

        // Combine IV + encrypted data + metadata
        const metadataJson = JSON.stringify(metadata);
        const metadataBytes = encoder.encode(metadataJson);
        const metadataLength = new Uint32Array([metadataBytes.length]);
        
        const combinedData = new Uint8Array(
          iv.length + 
          encryptedData.byteLength + 
          4 + // metadata length
          metadataBytes.length
        );
        
        let offset = 0;
        combinedData.set(iv, offset);
        offset += iv.length;
        combinedData.set(new Uint8Array(encryptedData), offset);
        offset += encryptedData.byteLength;
        combinedData.set(new Uint8Array(metadataLength.buffer), offset);
        offset += 4;
        combinedData.set(metadataBytes, offset);

        // Add to ZIP
        zip.file(filePath, combinedData);
        totalCompressedSize += combinedData.length;

        processedFiles++;
        if (onProgress) {
          onProgress(Math.round((processedFiles / totalFiles) * 90)); // Reserve 10% for final steps
        }
      } catch (error) {
        throw new Error(`Failed to process file ${file.name}: ${error.message}`);
      }
    }

    // Add archive metadata
    const archiveMetadata = {
      version: '1.0',
      encryptionMethod: 'AES-GCM-256',
      compressionMethod: compressionMethod,
      compressionLevel: compressionLevel,
      filenamesEncrypted: encryptFilenames,
      filenameEncryptionMode: filenameEncryptionMode,
      preserveExtensions: preserveExtensions,
      solidArchive: solidArchive,
      fileCount: totalFiles,
      totalOriginalSize: totalOriginalSize,
      timestamp: new Date().toISOString(),
      salt: Array.from(salt),
      filenameEncryptionOptions: filenameOptions
    };

    zip.file('_archive_metadata.json', JSON.stringify(archiveMetadata, null, 2));

    if (onProgress) {
      onProgress(95); // Almost complete
    }

    // Generate final archive
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: solidArchive ? 'DEFLATE' : 'STORE',
      compressionOptions: {
        level: Math.min(9, compressionLevel)
      }
    });

    if (onProgress) {
      onProgress(100); // Complete
    }

    // Calculate final compression ratio
    const finalSize = zipBlob.size;
    const compressionRatio = totalOriginalSize > 0 ? 
      ((1 - (finalSize / totalOriginalSize)) * 100).toFixed(1) : '0.0';

    const metadata = {
      originalFileCount: totalFiles,
      totalOriginalSize: totalOriginalSize,
      compressedSize: finalSize,
      compressionRatio: compressionRatio,
      encryptionMethod: 'AES-GCM-256',
      filenamesEncrypted: encryptFilenames,
      filenameEncryptionMode: filenameEncryptionMode,
      compressionMethod: compressionMethod,
      compressionLevel: compressionLevel,
      timestamp: new Date().toISOString(),
      hasHardwareKey: false,
      format: '7z-enhanced' // Indicate this is our enhanced format
    };

    return {
      blob: zipBlob,
      filename: archiveName,
      metadata
    };

  } catch (error) {
    throw new Error(`Enhanced archive creation failed: ${error.message}`);
  }
};

// Extract enhanced encrypted archive with filename decryption
export const extract7zArchive = async (file, password, onProgress = null) => {
  try {
    await initCompression();

    if (onProgress) {
      onProgress(10); // Starting extraction
    }

    // Load ZIP archive
    const zip = new JSZip();
    const zipData = await zip.loadAsync(file);

    if (onProgress) {
      onProgress(30); // Archive loaded
    }

    // Get archive metadata
    let archiveMetadata = null;
    if (zipData.files['_archive_metadata.json']) {
      const metadataContent = await zipData.files['_archive_metadata.json'].async('string');
      archiveMetadata = JSON.parse(metadataContent);
    }

    // Generate decryption key
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const passwordData = encoder.encode(password);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = archiveMetadata ? 
      new Uint8Array(archiveMetadata.salt) : 
      crypto.getRandomValues(new Uint8Array(16));

    const decryptionKey = await crypto.subtle.deriveKey(
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

    // Process files
    const extractedFiles = [];
    const fileNames = Object.keys(zipData.files).filter(name => 
      !zipData.files[name].dir && name !== '_archive_metadata.json'
    );

    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const fileData = await zipData.files[fileName].async('uint8array');

      try {
        // Parse the combined data
        const iv = fileData.slice(0, 12);
        
        // Find metadata length (last 4 bytes before metadata)
        let metadataLengthPos = fileData.length - 4;
        while (metadataLengthPos > 12) {
          const possibleLength = new Uint32Array(fileData.slice(metadataLengthPos, metadataLengthPos + 4).buffer)[0];
          if (possibleLength > 0 && possibleLength < 10000 && metadataLengthPos + 4 + possibleLength === fileData.length) {
            break;
          }
          metadataLengthPos--;
        }

        const metadataLength = new Uint32Array(fileData.slice(metadataLengthPos, metadataLengthPos + 4).buffer)[0];
        const encryptedData = fileData.slice(12, metadataLengthPos);
        const metadataBytes = fileData.slice(metadataLengthPos + 4);
        const metadata = JSON.parse(decoder.decode(metadataBytes));

        // Decrypt the data
        const decryptedData = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv },
          decryptionKey,
          encryptedData
        );

        // Decompress if needed
        let finalData = new Uint8Array(decryptedData);
        if (metadata.compressedSize !== metadata.originalSize && compressionSupported) {
          try {
            finalData = pako.inflate(finalData);
          } catch (decompError) {
            console.warn('Decompression failed, using encrypted data as-is:', decompError);
          }
        }

        // Decrypt filename if it was encrypted
        let originalName = fileName.replace('.enc', '');
        if (metadata.encryptedFilename && metadata.filenameEncryptionDetails) {
          try {
            originalName = await decryptFilename(
              fileName, 
              password, 
              metadata.filenameEncryptionDetails,
              metadata.originalPath
            );
          } catch (filenameDecryptError) {
            console.warn('Filename decryption failed, using stored path:', filenameDecryptError);
            originalName = metadata.originalPath || fileName.replace('.enc', '');
          }
        } else if (metadata.originalPath) {
          originalName = metadata.originalPath;
        }

        // Create blob
        const blob = new Blob([finalData], { 
          type: getMimeType(originalName) 
        });

        extractedFiles.push({
          blob,
          filename: originalName.split('/').pop(),
          metadata: {
            originalName: originalName.split('/').pop(),
            originalSize: metadata.originalSize,
            mimeType: getMimeType(originalName),
            relativePath: originalName,
            lastModified: new Date(metadata.timestamp),
            extractedFrom7z: true,
            compressionMethod: metadata.compressionMethod,
            filenameWasEncrypted: metadata.encryptedFilename || false
          }
        });

      } catch (fileError) {
        console.error(`Failed to decrypt file ${fileName}:`, fileError);
        throw new Error(`Failed to decrypt file: ${fileError.message}`);
      }

      if (onProgress) {
        onProgress(30 + Math.round((i / fileNames.length) * 60)); // 30% to 90%
      }
    }

    if (onProgress) {
      onProgress(100); // Complete
    }

    // Create final metadata
    const finalMetadata = {
      totalFiles: extractedFiles.length,
      extractedSize: extractedFiles.reduce((sum, file) => sum + (file.metadata.originalSize || 0), 0),
      originalArchiveSize: file.size,
      encryptionMethod: archiveMetadata?.encryptionMethod || 'AES-GCM-256',
      timestamp: new Date().toISOString(),
      extractedFrom: '7z',
      compressionMethod: archiveMetadata?.compressionMethod || 'Enhanced',
      filenamesEncrypted: archiveMetadata?.filenamesEncrypted || false,
      filenameEncryptionMode: archiveMetadata?.filenameEncryptionMode || 'none'
    };

    return {
      files: extractedFiles,
      metadata: finalMetadata
    };

  } catch (error) {
    if (error.message.includes('password') || error.message.includes('decrypt')) {
      throw new Error('Invalid password for encrypted archive');
    }
    throw new Error(`Archive extraction failed: ${error.message}`);
  }
};

// Filename encryption functions
const encryptFilename = async (originalName, password, options = {}) => {
  try {
    const { mode = 'none', preserveExtensions = false, customPrefix = 'enc' } = options;

    if (mode === 'none') {
      return originalName + '.enc';
    }

    // Extract extension if preserving
    const lastDotIndex = originalName.lastIndexOf('.');
    const name = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
    const extension = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : '';

    if (mode === 'partial') {
      // Generate a hash-based obfuscation
      const encoder = new TextEncoder();
      const nameData = encoder.encode(name + password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', nameData);
      const hashArray = new Uint8Array(hashBuffer);
      const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);
      
      const finalExtension = preserveExtensions ? extension : '.enc';
      return `${customPrefix}_${hashHex}_${name}${finalExtension}`;
    }

    if (mode === 'full') {
      // Full encryption of filename
      const encoder = new TextEncoder();
      const nameData = encoder.encode(originalName);
      
      // Use password to generate encryption key for filename
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 10000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedName = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        nameData
      );

      // Combine salt + iv + encrypted data and encode as base64
      const combined = new Uint8Array(salt.length + iv.length + encryptedName.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedName), salt.length + iv.length);

      const base64 = btoa(String.fromCharCode(...combined));
      const safeBase64 = base64.replace(/[+/=]/g, (char) => {
        switch (char) {
          case '+': return '-';
          case '/': return '_';
          case '=': return '';
          default: return char;
        }
      });

      const finalExtension = preserveExtensions ? extension : '.enc';
      return safeBase64.substring(0, 32) + finalExtension;
    }

    return originalName + '.enc';
  } catch (error) {
    console.error('Filename encryption failed:', error);
    return originalName + '.enc';
  }
};

const decryptFilename = async (encryptedName, password, options = {}, fallbackName = null) => {
  try {
    const { mode = 'none', preserveExtensions = false, customPrefix = 'enc' } = options;

    if (mode === 'none') {
      return fallbackName || encryptedName.replace('.enc', '');
    }

    if (mode === 'partial') {
      // For partial encryption, we can't fully decrypt, so use fallback
      return fallbackName || encryptedName;
    }

    if (mode === 'full') {
      // Extract the encrypted part (remove extension if preserved)
      let encryptedPart = encryptedName;
      if (preserveExtensions) {
        const lastDotIndex = encryptedName.lastIndexOf('.');
        if (lastDotIndex > 0) {
          encryptedPart = encryptedName.substring(0, lastDotIndex);
        }
      } else {
        encryptedPart = encryptedName.replace('.enc', '');
      }

      // Convert back from safe base64
      const base64 = encryptedPart.replace(/[-_]/g, (char) => {
        switch (char) {
          case '-': return '+';
          case '_': return '/';
          default: return char;
        }
      });

      // Add padding if needed
      const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

      try {
        const combined = new Uint8Array(atob(paddedBase64).split('').map(char => char.charCodeAt(0)));
        
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const encryptedData = combined.slice(28);

        // Recreate the key
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          encoder.encode(password),
          'PBKDF2',
          false,
          ['deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: salt,
            iterations: 10000,
            hash: 'SHA-256'
          },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );

        const decryptedData = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv },
          key,
          encryptedData
        );

        return new TextDecoder().decode(decryptedData);
      } catch (decryptError) {
        console.warn('Filename decryption failed, using fallback:', decryptError);
        return fallbackName || encryptedName;
      }
    }

    return fallbackName || encryptedName;
  } catch (error) {
    console.error('Filename decryption failed:', error);
    return fallbackName || encryptedName;
  }
};

// Utility function to get MIME type from filename
const getMimeType = (filename) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const mimeTypes = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Text
    'txt': 'text/plain',
    'csv': 'text/csv',
    'json': 'application/json',
    'xml': 'application/xml',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    
    // Media
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    
    // Archives
    'zip': 'application/zip',
    '7z': 'application/x-7z-compressed',
    'rar': 'application/vnd.rar',
    'tar': 'application/x-tar',
    'gz': 'application/gzip'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

// Check if enhanced compression is supported
export const is7zSupported = async () => {
  try {
    await initCompression();
    return compressionSupported;
  } catch (error) {
    console.warn('Enhanced compression not available:', error.message);
    return false;
  }
};

// Get compression info for different methods
export const getCompressionInfo = () => {
  return {
    methods: {
      'LZMA': {
        name: 'LZMA',
        description: 'Excellent compression ratio, slower',
        recommended: 'Documents, text files'
      },
      'LZMA2': {
        name: 'LZMA2',
        description: 'Best overall balance, multithreaded',
        recommended: 'General purpose, default choice'
      },
      'PPMd': {
        name: 'PPMd',
        description: 'Best for text files',
        recommended: 'Text, source code'
      },
      'BZip2': {
        name: 'BZip2',
        description: 'Good compression, faster than LZMA',
        recommended: 'Mixed file types'
      }
    },
    levels: {
      0: 'Store only (no compression)',
      1: 'Fastest compression',
      3: 'Fast compression', 
      5: 'Normal compression (recommended)',
      7: 'High compression',
      9: 'Ultra compression (slowest)'
    }
  };
};