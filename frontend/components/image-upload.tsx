'use client'

import { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  selectedFile: File | null
  previewUrl: string | null
  isUploading: boolean
  isGenerating: boolean
  error: string | null
  onFileSelect: (file: File) => void
  onGenerate: () => void
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
const MAX_FILE_SIZE = 5 * 1024 * 1024

export function ImageUpload({
  selectedFile,
  previewUrl,
  isUploading,
  isGenerating,
  error,
  onFileSelect,
  onGenerate,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a PNG or JPG image.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 5MB.'
    }
    return null
  }, [])

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (!file) return

      const error = validateFile(file)
      if (error) {
        setValidationError(error)
        return
      }

      setValidationError(null)
      onFileSelect(file)
    },
    [validateFile, onFileSelect]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileChange(file)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0] || null
      handleFileChange(file)
    },
    [handleFileChange]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleChooseClick = () => {
    fileInputRef.current?.click()
  }

  const displayError = validationError || error
  const canGenerate = selectedFile && !isUploading && !isGenerating
  const isLoading = isUploading || isGenerating

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#c8c8c8] px-2 py-2">
      <h1 className="mb-2 font-serif text-2xl font-normal tracking-wide text-neutral-800">
        Image to 3D Surface Tool
      </h1>

      <Button
        onClick={handleChooseClick}
        disabled={isLoading}
        className="mb-2 bg-[#e8945a] px-6 py-2 text-sm font-medium text-white hover:bg-[#d88550]"
      >
        <Upload className="mr-2 size-4" />
        Choose an Image
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative mb-2 flex h-[calc(100vh-200px)] w-full items-center justify-center overflow-hidden rounded-lg bg-[#1a1a1a] transition-all ${
          dragOver ? 'ring-2 ring-[#e8945a]' : ''
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center text-neutral-300">
            <ImageIcon className="mb-2 size-12 opacity-100" />
            <span className="text-base font-medium">Image Preview</span>
            <span className="mt-1 text-sm opacity-100">
              Drag & drop or click above
            </span>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="flex flex-col items-center text-white">
              <div className="mb-2 size-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="text-sm">
                {isUploading ? 'Uploading...' : 'Generating Surface...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {displayError && (
        <p className="mb-2 text-sm text-red-600">{displayError}</p>
      )}

      <Button
        onClick={onGenerate}
        disabled={!canGenerate}
        className="bg-[#e8945a] px-6 py-2 text-sm font-medium text-white hover:bg-[#d88550] disabled:bg-[#c4a080] disabled:opacity-70"
      >
        Generate Surface!
      </Button>
    </div>
  )
}
