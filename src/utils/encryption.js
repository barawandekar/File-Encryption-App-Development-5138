import JSZip from 'jszip';

// Enhanced encryption utilities with comprehensive filename encryption support

export const encryptFile = async (file, password, hardwareKey = null, filenameOptions = {}) => {
  try {
    // Generate salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from password (and hardware key if provided)
    const key = await deriveEncryptionKey(password, salt, hardwareKey);

    // Read file as array buffer
    const fileBuffer = await file.arrayBuffer();

    // Encrypt the file
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      fileBuffer
    );

    // Create comprehensive file metadata
    const metadata = {
      originalName: file.name,
      originalSize: file.size,
      mimeType: file.type,
      timestamp: Date.now(),
      hasHardwareKey: !!hardwareKey,
      relativePath: file.webkitRelativePath || '',
      isFromFolder: file.isFromFolder || false,
      folderStructure: file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(0, -1) : [],
      // Filename encryption metadata
      filenameEncryption: filenameOptions || { mode: 'none' }
    };

    const metadataBuffer = new TextEncoder().encode(JSON.stringify(metadata));
    const metadataLength = new Uint32Array([metadataBuffer.length]);

    // Include hardware key salt if present
    const hardwareSalt = hardwareKey ? hardwareKey.salt : new Uint8Array(0);
    const hardwareSaltLength = new Uint32Array([hardwareSalt.length]);

    // Combine all data
    const result = new Uint8Array(
      salt.length +
      iv.length +
      hardwareSaltLength.buffer.byteLength +
      hardwareSalt.length +
      metadataLength.buffer.byteLength +
      metadataBuffer.length +
      encryptedData.byteLength
    );

    let offset = 0;
    result.set(salt, offset);
    offset += salt.length;
    result.set(iv, offset);
    offset += iv.length;
    result.set(new Uint8Array(hardwareSaltLength.buffer), offset);
    offset += hardwareSaltLength.buffer.byteLength;
    result.set(hardwareSalt, offset);
    offset += hardwareSalt.length;
    result.set(new Uint8Array(metadataLength.buffer), offset);
    offset += metadataLength.buffer.byteLength;
    result.set(metadataBuffer, offset);
    offset += metadataBuffer.length;
    result.set(new Uint8Array(encryptedData), offset);

    // Apply filename encryption
    const encryptedFilename = await encryptFilename(file.name, password, filenameOptions);

    // Create blob and filename
    const blob = new Blob([result], { type: 'application/octet-stream' });

    return {
      blob,
      filename: encryptedFilename
    };
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
};

export const encryptMultipleFiles = async (files, password, hardwareKey = null, onProgress = null, archiveOptions = {}) => {
  try {
    const zip = new JSZip();
    const totalFiles = files.length;
    let processedFiles = 0;

    // Extract filename encryption options
    const filenameOptions = {
      mode: archiveOptions.filenameEncryptionMode || 'none',
      preserveExtensions: archiveOptions.preserveExtensions || false,
      customPrefix: archiveOptions.customPrefix || 'enc'
    };

    // Group files by folder structure
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

    // Create metadata for the entire archive
    const archiveMetadata = {
      totalFiles: totalFiles,
      hasHardwareKey: !!hardwareKey,
      timestamp: Date.now(),
      folderCount: Object.keys(folderStructure).length,
      individualFileCount: individualFiles.length,
      filenameEncryption: filenameOptions,
      structure: {
        folders: Object.keys(folderStructure).map(folderName => ({
          name: folderName,
          fileCount: folderStructure[folderName].length
        })),
        individualFiles: individualFiles.map(file => file.name)
      }
    };

    // Add metadata to zip
    zip.file('_archive_metadata.json', JSON.stringify(archiveMetadata, null, 2));

    // Process folders
    for (const [folderName, folderFiles] of Object.entries(folderStructure)) {
      // Create folder metadata
      const folderMetadata = {
        name: folderName,
        fileCount: folderFiles.length,
        totalSize: folderFiles.reduce((sum, file) => sum + file.size, 0),
        files: folderFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          path: file.webkitRelativePath
        }))
      };

      // Add folder metadata
      zip.file(`${folderName}/_folder_metadata.json`, JSON.stringify(folderMetadata, null, 2));

      // Encrypt each file in the folder
      for (const file of folderFiles) {
        const encryptedFile = await encryptFile(file, password, hardwareKey, filenameOptions);
        const encryptedBuffer = await encryptedFile.blob.arrayBuffer();

        // Apply filename encryption to path
        let encryptedPath;
        if (filenameOptions.mode !== 'none') {
          const pathParts = file.webkitRelativePath.split('/');
          const encryptedFilename = await encryptFilename(pathParts[pathParts.length - 1], password, filenameOptions);
          pathParts[pathParts.length - 1] = encryptedFilename;
          encryptedPath = pathParts.join('/');
        } else {
          encryptedPath = file.webkitRelativePath + '.enc';
        }

        zip.file(encryptedPath, encryptedBuffer);

        processedFiles++;
        if (onProgress) {
          onProgress((processedFiles / totalFiles) * 100);
        }
      }
    }

    // Process individual files
    for (const file of individualFiles) {
      const encryptedFile = await encryptFile(file, password, hardwareKey, filenameOptions);
      const encryptedBuffer = await encryptedFile.blob.arrayBuffer();
      
      zip.file(encryptedFile.filename, encryptedBuffer);

      processedFiles++;
      if (onProgress) {
        onProgress((processedFiles / totalFiles) * 100);
      }
    }

    // Generate zip file
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hasFolder = Object.keys(folderStructure).length > 0;
    const filename = hasFolder 
      ? `encrypted-folders-${timestamp}.zip` 
      : `encrypted-files-${timestamp}.zip`;

    return {
      blob: zipBlob,
      filename
    };
  } catch (error) {
    throw new Error('Multiple file encryption failed: ' + error.message);
  }
};

export const decryptFile = async (file, password, hardwareKey = null) => {
  try {
    // Read encrypted file
    const encryptedBuffer = await file.arrayBuffer();
    const encryptedData = new Uint8Array(encryptedBuffer);

    // Extract components
    let offset = 0;
    const salt = encryptedData.slice(offset, offset + 16);
    offset += 16;
    const iv = encryptedData.slice(offset, offset + 12);
    offset += 12;

    // Extract hardware salt length and data
    const hardwareSaltLength = new Uint32Array(encryptedData.slice(offset, offset + 4).buffer)[0];
    offset += 4;
    const hardwareSalt = encryptedData.slice(offset, offset + hardwareSaltLength);
    offset += hardwareSaltLength;

    const metadataLength = new Uint32Array(encryptedData.slice(offset, offset + 4).buffer)[0];
    offset += 4;
    const metadataBuffer = encryptedData.slice(offset, offset + metadataLength);
    offset += metadataLength;
    const fileData = encryptedData.slice(offset);

    // Parse metadata
    const metadata = JSON.parse(new TextDecoder().decode(metadataBuffer));

    // Check if hardware key is required
    if (metadata.hasHardwareKey && !hardwareKey) {
      throw new Error('Hardware key authentication required for this file');
    }

    // Reconstruct hardware key if present
    let reconstructedHardwareKey = null;
    if (metadata.hasHardwareKey && hardwareKey) {
      reconstructedHardwareKey = { ...hardwareKey, salt: hardwareSalt };
    }

    // Derive key from password (and hardware key if required)
    const key = await deriveEncryptionKey(password, salt, reconstructedHardwareKey);

    // Decrypt the file
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      fileData
    );

    // Decrypt filename if it was encrypted
    let originalFilename = metadata.originalName;
    if (metadata.filenameEncryption && metadata.filenameEncryption.mode !== 'none') {
      originalFilename = await decryptFilename(file.name, password, metadata.filenameEncryption, metadata.originalName);
    }

    // Create blob and filename
    const blob = new Blob([decryptedData], { type: metadata.mimeType });

    return {
      blob,
      filename: originalFilename,
      metadata: {
        ...metadata,
        decryptedFilename: originalFilename
      }
    };
  } catch (error) {
    if (error.name === 'OperationError') {
      throw new Error('Invalid password, hardware key, or corrupted file');
    }
    throw new Error('Decryption failed: ' + error.message);
  }
};

export const decryptZipFile = async (file, password, hardwareKey = null, onProgress = null) => {
  try {
    const zip = new JSZip();
    const zipData = await zip.loadAsync(file);
    const files = Object.keys(zipData.files);
    const totalFiles = files.length;
    let processedFiles = 0;
    const decryptedFiles = [];

    // Check for archive metadata
    let archiveMetadata = null;
    if (zipData.files['_archive_metadata.json']) {
      const metadataContent = await zipData.files['_archive_metadata.json'].async('string');
      archiveMetadata = JSON.parse(metadataContent);
    }

    // Process files and maintain folder structure
    for (const filename of files) {
      if (zipData.files[filename].dir) continue; // Skip directories
      if (filename.endsWith('_metadata.json')) continue; // Skip metadata files
      if (!filename.endsWith('.enc') && !isEncryptedFilename(filename, archiveMetadata?.filenameEncryption)) continue; // Only process encrypted files

      const encryptedBlob = await zipData.files[filename].async('blob');
      const decryptedFile = await decryptFile(encryptedBlob, password, hardwareKey);

      // Reconstruct original path structure
      let originalPath = filename.replace('.enc', '');
      if (archiveMetadata?.filenameEncryption?.mode !== 'none') {
        originalPath = await decryptFilename(filename, password, archiveMetadata.filenameEncryption, decryptedFile.metadata.originalName);
      }

      decryptedFiles.push({
        ...decryptedFile,
        originalPath: originalPath,
        folderPath: decryptedFile.metadata.folderStructure || []
      });

      processedFiles++;
      if (onProgress) {
        onProgress((processedFiles / totalFiles) * 100);
      }
    }

    return {
      files: decryptedFiles,
      metadata: archiveMetadata
    };
  } catch (error) {
    throw new Error('Zip decryption failed: ' + error.message);
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

const isEncryptedFilename = (filename, encryptionOptions) => {
  if (!encryptionOptions || encryptionOptions.mode === 'none') {
    return filename.endsWith('.enc');
  }

  if (encryptionOptions.mode === 'partial') {
    const prefix = encryptionOptions.customPrefix || 'enc';
    return filename.includes(`${prefix}_`) || filename.endsWith('.enc');
  }

  if (encryptionOptions.mode === 'full') {
    // Check if it looks like an encrypted filename (base64-like)
    const withoutExt = filename.replace(/\.[^.]+$/, '');
    return /^[A-Za-z0-9_-]+$/.test(withoutExt) && withoutExt.length >= 16;
  }

  return filename.endsWith('.enc');
};

// Helper function to derive encryption key
const deriveEncryptionKey = async (password, salt, hardwareKey = null) => {
  // Start with password-based key derivation
  const passwordBuffer = new TextEncoder().encode(password);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  if (!hardwareKey) {
    // Standard password-only encryption
    return await crypto.subtle.deriveKey(
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
  } else {
    // Combine password and hardware key
    const passwordKey = await crypto.subtle.deriveKey(
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

    // Export both keys to combine them
    const passwordKeyBuffer = await crypto.subtle.exportKey('raw', passwordKey);
    const hardwareKeyBuffer = await crypto.subtle.exportKey('raw', hardwareKey.key);

    // Combine the keys using XOR
    const combinedKey = new Uint8Array(32);
    const passwordArray = new Uint8Array(passwordKeyBuffer);
    const hardwareArray = new Uint8Array(hardwareKeyBuffer);

    for (let i = 0; i < 32; i++) {
      combinedKey[i] = passwordArray[i] ^ hardwareArray[i];
    }

    // Import the combined key
    return await crypto.subtle.importKey(
      'raw',
      combinedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
};

// Enhanced utility function to download multiple files with folder structure
export const downloadMultipleFiles = (files, folderName = 'decrypted-files') => {
  const zip = new JSZip();

  files.forEach(file => {
    const path = file.originalPath || file.filename;
    zip.file(path, file.blob);
  });

  zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  }).then(zipBlob => {
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};

// New utility function to download files with preserved folder structure
export const downloadWithFolderStructure = (decryptedResult, baseName = 'decrypted') => {
  const zip = new JSZip();

  if (decryptedResult.files) {
    // Multiple files with metadata
    decryptedResult.files.forEach(file => {
      const path = file.metadata.relativePath || file.filename;
      zip.file(path, file.blob);
    });

    // Add metadata if available
    if (decryptedResult.metadata) {
      zip.file('_restore_info.json', JSON.stringify(decryptedResult.metadata, null, 2));
    }
  } else {
    // Single file
    zip.file(decryptedResult.filename, decryptedResult.blob);
  }

  zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  }).then(zipBlob => {
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}-restored.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};