'use client'

import { useState, useCallback, useEffect } from 'react'
import { ImageUpload } from '@/components/image-upload'
import { SurfaceViewer } from '@/components/surface-viewer'
import * as api from '@/lib/api'
import type { AppScreen, LoadingState, Mesh } from '@/lib/types'

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageId, setImageId] = useState<string | null>(null)
  const [currentMesh, setCurrentMesh] = useState<Mesh | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [resolution, setResolution] = useState(0.25)
  const [smoothStrength, setSmoothStrength] = useState(5)
  const [zScale, setZScale] = useState(1.0)

  useEffect(() => {
    return () => {
      api.cancelPendingRequests()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFileSelect = useCallback(async (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setError(null)
    setPreviewUrl(URL.createObjectURL(file))
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
    if (!imageId) { setError('No image uploaded'); return }
    setLoadingState('generating')
    setError(null)
    try {
      const response = await api.generateSurface(imageId, resolution, smoothStrength, zScale)
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
  }, [imageId, resolution, smoothStrength, zScale])

  const handleExport = useCallback(async (
    scaleStrength: number,
    smoothIntensity: number,
    sharpenIntensity: number
  ) => {
    if (!imageId) { setError('No image loaded'); return }
    setLoadingState('exporting')
    setError(null)
    try {
      const response = await api.exportMesh(
        imageId,
        zScale,
        smoothStrength,
        resolution,
        scaleStrength,
        sharpenIntensity
      )
      if (!response.success) throw new Error(response.message || 'Export failed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export mesh')
    } finally {
      setLoadingState('idle')
    }
  }, [imageId, resolution, smoothStrength, zScale])

  const handleBack = useCallback(() => {
    setScreen('upload')
    setCurrentMesh(null)
    setShowEditPanel(false)
  }, [])

  const handleToggleEditPanel = useCallback(() => {
    setShowEditPanel((prev) => !prev)
  }, [])

  if (screen === 'viewer') {
    return (
      <SurfaceViewer
        mesh={currentMesh}
        isExporting={loadingState === 'exporting'}
        showEditPanel={showEditPanel}
        imageId={imageId}
        onToggleEditPanel={handleToggleEditPanel}
        onExport={handleExport}
        onResetView={() => {}}
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
      resolution={resolution}
      smoothStrength={smoothStrength}
      zScale={zScale}
      onFileSelect={handleFileSelect}
      onGenerate={handleGenerate}
      onResolutionChange={setResolution}
      onSmoothStrengthChange={setSmoothStrength}
      onZScaleChange={setZScale}
    />
  )
}