'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { EditOperation } from '@/lib/types'

interface EditControlsProps {
  isOpen: boolean
  isEditing: boolean
  onToggle: () => void
  onApplyEdit: (operation: EditOperation, intensity: number) => void
  onReset: () => void
}

export function EditControls({
  isOpen,
  isEditing,
  onToggle,
  onApplyEdit,
  onReset,
}: EditControlsProps) {
  const [heightScale, setHeightScale] = useState(50)
  const [smoothIntensity, setSmoothIntensity] = useState(50)
  const [noiseFilterIntensity, setNoiseFilterIntensity] = useState(50)

  const handleApplyScale = useCallback(() => {
    const intensity = heightScale / 100
    onApplyEdit('scale', intensity)
  }, [heightScale, onApplyEdit])

  const handleApplySmooth = useCallback(() => {
    const intensity = smoothIntensity / 100
    onApplyEdit('smooth', intensity)
  }, [smoothIntensity, onApplyEdit])

  const handleApplyNoise = useCallback(() => {
    const intensity = noiseFilterIntensity / 100
    onApplyEdit('sharpen', intensity)
  }, [noiseFilterIntensity, onApplyEdit])

  return (
    <div className="absolute right-4 top-4 z-10">
      <Button
        onClick={onToggle}
        className="mb-2 bg-[#e8945a] px-4 py-1 text-sm font-medium text-white hover:bg-[#d88550]"
      >
        Edit
      </Button>

      {isOpen && (
        <div className="w-48 rounded-lg bg-neutral-800 p-3 shadow-lg">
          <h3 className="mb-3 border-b border-neutral-600 pb-2 text-center text-sm font-medium text-[#e8945a]">
            Editing Tools
          </h3>

          <div className="mb-4">
            <label className="mb-1 block text-xs text-neutral-300">
              Height Scale
            </label>
            <div className="flex items-center gap-2">
              <Slider
                value={[heightScale]}
                onValueChange={(v) => setHeightScale(v[0])}
                min={0}
                max={100}
                step={1}
                disabled={isEditing}
                className="flex-1 [&_[data-slot=slider-range]]:bg-[#e8945a] [&_[data-slot=slider-thumb]]:border-[#e8945a]"
              />
            </div>
            <Button
              onClick={handleApplyScale}
              disabled={isEditing}
              size="sm"
              className="mt-1 h-6 w-full bg-[#e8945a] text-xs text-white hover:bg-[#d88550]"
            >
              Apply
            </Button>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs text-neutral-300">
              Smooth
            </label>
            <div className="flex items-center gap-2">
              <Slider
                value={[smoothIntensity]}
                onValueChange={(v) => setSmoothIntensity(v[0])}
                min={0}
                max={100}
                step={1}
                disabled={isEditing}
                className="flex-1 [&_[data-slot=slider-range]]:bg-[#e8945a] [&_[data-slot=slider-thumb]]:border-[#e8945a]"
              />
            </div>
            <Button
              onClick={handleApplySmooth}
              disabled={isEditing}
              size="sm"
              className="mt-1 h-6 w-full bg-[#e8945a] text-xs text-white hover:bg-[#d88550]"
            >
              Apply
            </Button>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs text-neutral-300">
              Sharpen
            </label>
            <div className="flex items-center gap-2">
              <Slider
                value={[noiseFilterIntensity]}
                onValueChange={(v) => setNoiseFilterIntensity(v[0])}
                min={0}
                max={100}
                step={1}
                disabled={isEditing}
                className="flex-1 [&_[data-slot=slider-range]]:bg-[#e8945a] [&_[data-slot=slider-thumb]]:border-[#e8945a]"
              />
            </div>
            <Button
              onClick={handleApplyNoise}
              disabled={isEditing}
              size="sm"
              className="mt-1 h-6 w-full bg-[#e8945a] text-xs text-white hover:bg-[#d88550]"
            >
              Apply
            </Button>
          </div>

          {/* Reset Button */}
          <Button
            onClick={onReset}
            size="sm"
            variant="outline"
            className="h-7 w-full border-neutral-500 bg-neutral-700 text-xs text-neutral-200 hover:bg-neutral-600"
          >
            Reset
          </Button>

          {/* Loading indicator */}
          {isEditing && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-neutral-400">
              <div className="size-3 animate-spin rounded-full border border-neutral-400 border-t-transparent" />
              Applying...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
