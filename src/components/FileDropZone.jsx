import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiUpload, FiFile, FiFolder, FiX, FiPlus, FiFolderPlus } = FiIcons;

const FileDropZone = ({ 
  onFileSelect, 
  selectedFiles = [], 
  acceptedTypes = "*", 
  placeholder = "Drop files and folders here or click to browse",
  allowMultiple = false,
  allowFolders = false 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedItemType, setDraggedItemType] = useState(null); // 'files' or 'folders'
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
    
    // Detect if dragged items contain folders
    const items = Array.from(e.dataTransfer.items);
    const hasFolder = items.some(item => item.webkitGetAsEntry()?.isDirectory);
    setDraggedItemType(hasFolder ? 'folders' : 'files');
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    setDraggedItemType(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    setDraggedItemType(null);

    const files = Array.from(e.dataTransfer.files);
    const items = Array.from(e.dataTransfer.items);
    
    // Process dropped items with folder structure
    const processedFiles = [];
    
    const processEntry = async (entry, path = '') => {
      if (entry.isFile) {
        return new Promise((resolve) => {
          entry.file((file) => {
            const fileWithPath = new File([file], path + file.name, { type: file.type });
            fileWithPath.webkitRelativePath = path + file.name;
            fileWithPath.isFromFolder = path !== '';
            resolve(fileWithPath);
          });
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        return new Promise((resolve) => {
          dirReader.readEntries(async (entries) => {
            const subFiles = [];
            for (const subEntry of entries) {
              const subFile = await processEntry(subEntry, path + entry.name + '/');
              if (Array.isArray(subFile)) {
                subFiles.push(...subFile);
              } else {
                subFiles.push(subFile);
              }
            }
            resolve(subFiles);
          });
        });
      }
    };

    // Process all dropped items
    Promise.all(items.map(async (item) => {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        return await processEntry(entry);
      }
      return null;
    })).then((results) => {
      const allFiles = results.flat().filter(Boolean);
      if (allFiles.length > 0) {
        onFileSelect(allowMultiple ? allFiles : allFiles[0]);
      } else if (files.length > 0) {
        // Fallback to regular file handling
        const filesWithMetadata = files.map(file => {
          file.isFromFolder = false;
          return file;
        });
        onFileSelect(allowMultiple ? filesWithMetadata : filesWithMetadata[0]);
      }
    });
  }, [onFileSelect, allowMultiple]);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const filesWithMetadata = files.map(file => {
        file.isFromFolder = false;
        return file;
      });
      onFileSelect(allowMultiple ? filesWithMetadata : filesWithMetadata[0]);
    }
  }, [onFileSelect, allowMultiple]);

  const handleFolderInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const filesWithMetadata = files.map(file => {
        file.isFromFolder = true;
        return file;
      });
      onFileSelect(filesWithMetadata);
    }
  }, [onFileSelect]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (index) => {
    if (allowMultiple) {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      onFileSelect(newFiles.length > 0 ? newFiles : null);
    } else {
      onFileSelect(null);
    }
  };

  const getFileIcon = (file) => {
    if (file.isFromFolder || file.webkitRelativePath) {
      return FiFolder;
    }
    return FiFile;
  };

  const getFileDisplayName = (file) => {
    if (file.webkitRelativePath) {
      return file.webkitRelativePath;
    }
    return file.name;
  };

  const groupFilesByFolder = (files) => {
    const folders = {};
    const individualFiles = [];

    files.forEach(file => {
      if (file.webkitRelativePath) {
        const folderPath = file.webkitRelativePath.split('/')[0];
        if (!folders[folderPath]) {
          folders[folderPath] = [];
        }
        folders[folderPath].push(file);
      } else {
        individualFiles.push(file);
      }
    });

    return { folders, individualFiles };
  };

  const hasFiles = allowMultiple ? selectedFiles.length > 0 : selectedFiles;

  return (
    <div>
      {!hasFiles ? (
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
            isDragOver 
              ? draggedItemType === 'folders'
                ? 'border-green-500 bg-green-500/10'
                : 'border-purple-500 bg-purple-500/10'
              : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50'
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full ${
              isDragOver 
                ? draggedItemType === 'folders'
                  ? 'bg-green-500/20'
                  : 'bg-purple-500/20'
                : 'bg-slate-600/50'
            }`}>
              <SafeIcon 
                icon={isDragOver && draggedItemType === 'folders' ? FiFolderPlus : FiUpload} 
                className="text-3xl text-slate-300" 
              />
            </div>
            
            <div>
              <p className="text-lg font-medium text-white mb-1">
                {isDragOver 
                  ? draggedItemType === 'folders' 
                    ? 'Drop folders here to encrypt'
                    : 'Drop files here to encrypt'
                  : placeholder
                }
              </p>
              <p className="text-sm text-slate-400">
                Maximum file size: 100MB per file
              </p>
              {allowFolders && (
                <p className="text-sm text-green-400 mt-1">
                  📁 Folder structure will be preserved
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
              >
                <SafeIcon icon={FiFile} className="text-sm" />
                <span>Select Files</span>
              </button>
              
              {allowFolders && (
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 rounded-lg text-green-400 hover:text-green-300 transition-colors"
                >
                  <SafeIcon icon={FiFolderPlus} className="text-sm" />
                  <span>Select Folder</span>
                </button>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            multiple={allowMultiple}
            onChange={handleFileInput}
            className="hidden"
          />
          
          {allowFolders && (
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory="true"
              multiple
              onChange={handleFolderInput}
              className="hidden"
            />
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">
              Selected {allowMultiple ? `Items (${selectedFiles.length} files)` : 'File'}
            </h3>
            <button
              onClick={() => onFileSelect(null)}
              className="text-slate-400 hover:text-red-400 transition-colors"
            >
              <SafeIcon icon={FiX} className="text-lg" />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {allowMultiple ? (
              (() => {
                const { folders, individualFiles } = groupFilesByFolder(selectedFiles);
                
                return (
                  <>
                    {/* Display folders */}
                    {Object.entries(folders).map(([folderName, files]) => (
                      <motion.div
                        key={folderName}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-700/50 border border-slate-600 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-500/20 p-2 rounded-lg">
                              <SafeIcon icon={FiFolder} className="text-green-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">📁 {folderName}</p>
                              <p className="text-sm text-slate-400">
                                {files.length} files • {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Show first few files in folder */}
                        <div className="ml-11 space-y-1">
                          {files.slice(0, 3).map((file, idx) => (
                            <p key={idx} className="text-xs text-slate-400 truncate">
                              {file.webkitRelativePath.split('/').slice(1).join('/')}
                            </p>
                          ))}
                          {files.length > 3 && (
                            <p className="text-xs text-slate-500">
                              ... and {files.length - 3} more files
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Display individual files */}
                    {individualFiles.map((file, index) => (
                      <motion.div
                        key={`individual-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-700/50 border border-slate-600 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-500/20 p-2 rounded-lg">
                              <SafeIcon icon={FiFile} className="text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">
                                {file.name}
                              </p>
                              <p className="text-sm text-slate-400">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(selectedFiles.indexOf(file))}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <SafeIcon icon={FiX} className="text-lg" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </>
                );
              })()
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-700/50 border border-slate-600 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <SafeIcon icon={getFileIcon(selectedFiles)} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {getFileDisplayName(selectedFiles)}
                      </p>
                      <p className="text-sm text-slate-400">{formatFileSize(selectedFiles.size)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {allowMultiple && (
            <div className="flex space-x-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <SafeIcon icon={FiPlus} className="text-sm" />
                <span>Add Files</span>
              </button>
              
              {allowFolders && (
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-700/50 hover:bg-green-600/50 border border-green-600 rounded-lg text-green-300 hover:text-white transition-colors"
                >
                  <SafeIcon icon={FiFolderPlus} className="text-sm" />
                  <span>Add Folder</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileDropZone;