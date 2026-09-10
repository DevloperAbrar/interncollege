import React, { useState, useRef } from 'react'
import { Upload, File, X, AlertCircle } from 'lucide-react'
import { formatFileSize } from '../../utils/helpers'
import { validateFile } from '../../utils/validation'

const FileUpload = ({ 
  onFileSelect, 
  accept = '', 
  multiple = false, 
  maxSize = 10 * 1024 * 1024,
  allowedTypes = [],
  label = 'Upload File',
  required = false,
  error = '',
  currentFile = null
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const fileInputRef = useRef(null)

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList)
    const validFiles = []
    const errors = []

    newFiles.forEach(file => {
      const fileErrors = validateFile(file, allowedTypes, maxSize)
      if (fileErrors.length === 0) {
        validFiles.push(file)
      } else {
        errors.push({ file: file.name, errors: fileErrors })
      }
    })

    if (multiple) {
      setFiles(prev => [...prev, ...validFiles])
      onFileSelect([...files, ...validFiles])
    } else {
      setFiles(validFiles.slice(0, 1))
      onFileSelect(validFiles[0] || null)
    }

    if (errors.length > 0) {
      console.error('File validation errors:', errors)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFileSelect(multiple ? newFiles : null)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="text-center">
          <Upload className={`mx-auto h-12 w-12 ${error ? 'text-red-400' : 'text-gray-400'}`} />
          <div className="mt-4">
            <button
              type="button"
              onClick={openFileDialog}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Click to upload
            </button>
            <span className="text-gray-500"> or drag and drop</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {allowedTypes.length > 0 && `${allowedTypes.join(', ').toUpperCase()} up to ${formatFileSize(maxSize)}`}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}

      {/* Current File Display */}
      {currentFile && !files.length && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <File className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Current: {currentFile}</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center">
                <File className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload