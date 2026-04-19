'use client'

import { useState, useCallback, useEffect } from 'react'
import { ImageUpload } from '@/components/image-upload'
import { SurfaceViewer } from '@/components/surface-viewer'
import * as api from '@/lib/api'
import type { AppScreen, LoadingState, Mesh, EditOperation } from '@/lib/types'

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageId, setImageId] = useState<string | null>(null)
  const [currentMesh, setCurrentMesh] = useState<Mesh | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [showEditPanel, setShowEditPanel] = useState(false)

  useEffect(() => {
    return () => {
      api.cancelPendingRequests()
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileSelect = useCallback(async (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(file)
    setError(null)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    setLoadingState('uploading')
    try {
      const response = await api.uploadImage(file)
      if (response.success) {
        setImageId(response.image_id)
      } else {
        throw new Error(response.message || 'Upload failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
      setImageId(null)
    } finally {
      setLoadingState('idle')
    }
  }, [previewUrl])

  const handleGenerate = useCallback(async () => {
    if (!imageId) {
      setError('No image uploaded')
      return
    }

    setLoadingState('generating')
    setError(null)

    try {
      const response = await api.generateSurface(imageId)
      if (response.success && response.mesh) {
        setCurrentMesh(response.mesh)
        setScreen('viewer')
        setShowEditPanel(false)
      } else {
        throw new Error(response.message || 'Failed to generate surface')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate surface')
    } finally {
      setLoadingState('idle')
    }
  }, [imageId])

  const handleApplyEdit = useCallback(async (operation: EditOperation, intensity: number) => {
    if (!imageId) {
      setError('No image loaded for editing')
      return
    }

    setLoadingState('editing')
    setError(null)

    try {
      const response = await api.applyEdit(imageId, operation, intensity)
      if (response.success && response.mesh) {
        setCurrentMesh(response.mesh)
      } else {
        throw new Error(response.message || 'Failed to apply edit')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply edit')
    } finally {
      setLoadingState('idle')
    }
  }, [imageId])

  const handleReset = useCallback(async () => {
    if (!imageId) {
      setError('No image loaded for reset')
      return
    }

    setLoadingState('resetting')
    setError(null)

    try {
      const response = await api.resetSurface(imageId)
      if (response.success && response.mesh) {
        // Reset returns the original mesh
        setCurrentMesh(response.mesh)
      } else {
        throw new Error(response.message || 'Failed to reset surface')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset surface')
    } finally {
      setLoadingState('idle')
    }
  }, [imageId])

  const handleBack = useCallback(() => {
    setScreen('upload')
    setCurrentMesh(null)
    setShowEditPanel(false)
  }, [])

  const handleToggleEditPanel = useCallback(() => {
    setShowEditPanel((prev) => !prev)
  }, [])

  const handleResetView = useCallback(() => {}, [])

  if (screen === 'viewer') {
    return (
      <SurfaceViewer
        mesh={currentMesh}
        isEditing={loadingState === 'editing' || loadingState === 'resetting'}
        showEditPanel={showEditPanel}
        onToggleEditPanel={handleToggleEditPanel}
        onApplyEdit={handleApplyEdit}
        onReset={handleReset}
        onResetView={handleResetView}
        onBack={handleBack}
      />
    )
  }

  return (
    <ImageUpload
      selectedFile={selectedFile}
      previewUrl={previewUrl}
      isUploading={loadingState === 'uploading'}
      isGenerating={loadingState === 'generating'}
      error={error}
      onFileSelect={handleFileSelect}
      onGenerate={handleGenerate}
    />
  )
}
