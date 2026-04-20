'use client'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface EditControlsProps {
  isOpen: boolean
  isExporting: boolean
  useImageColors: boolean
  onToggle: () => void
  onReset: () => void
  onExport: () => void
  onToggleImageColors: () => void
  heightScale: number
  smoothIntensity: number
  sharpenIntensity: number
  onHeightScaleChange: (value: number) => void
  onSmoothIntensityChange: (value: number) => void
  onSharpenIntensityChange: (value: number) => void
}

export function EditControls({
  isOpen,
  isExporting,
  useImageColors,
  onToggle,
  onReset,
  onExport,
  onToggleImageColors,
  heightScale,
  smoothIntensity,
  sharpenIntensity,
  onHeightScaleChange,
  onSmoothIntensityChange,
  onSharpenIntensityChange,
}: EditControlsProps) {
  return (
    <div className="absolute right-4 top-4 z-10">
      <Button
        onClick={onToggle}
        className="mb-2 bg-[#e8945a] px-4 py-1 text-sm font-medium text-white hover:bg-[#d88550]"
      >
        Edit
      </Button>

      {isOpen && (
        <div className="w-52 rounded-lg bg-neutral-800 p-3 shadow-lg">
          <h3 className="mb-3 border-b border-neutral-600 pb-2 text-center text-sm font-medium text-[#e8945a]">
            Editing Tools
          </h3>

          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs text-neutral-300">Height Scale</label>
              <span className="text-xs text-[#e8945a]">{heightScale.toFixed(2)}x</span>
            </div>
            <Slider
              value={[heightScale * 50]}
              onValueChange={(v) => onHeightScaleChange(v[0] / 50)}
              min={0} max={100} step={1}
              className="[&_[data-slot=slider-range]]:bg-[#e8945a] [&_[data-slot=slider-thumb]]:border-[#e8945a]"
            />
          </div>

          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs text-neutral-300">Smooth</label>
              <span className="text-xs text-[#e8945a]">{smoothIntensity.toFixed(2)}</span>
            </div>
            <Slider
              value={[smoothIntensity * 100]}
              onValueChange={(v) => onSmoothIntensityChange(v[0] / 100)}
              min={0} max={100} step={1}
              className="[&_[data-slot=slider-range]]:bg-[#e8945a] [&_[data-slot=slider-thumb]]:border-[#e8945a]"
            />
          </div>

          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs text-neutral-300">Sharpen</label>
              <span className="text-xs text-[#e8945a]">{sharpenIntensity.toFixed(2)}</span>
            </div>
            <Slider
              value={[sharpenIntensity * 100]}
              onValueChange={(v) => onSharpenIntensityChange(v[0] / 100)}
              min={0} max={100} step={1}
              className="[&_[data-slot=slider-range]]:bg-[#e8945a] [&_[data-slot=slider-thumb]]:border-[#e8945a]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={onToggleImageColors}
              size="sm"
              className={`h-7 w-full text-xs text-white ${useImageColors ? 'bg-[#e8945a] hover:bg-[#d88550]' : 'bg-neutral-600 hover:bg-neutral-500'}`}
            >
              {useImageColors ? 'Image Colors: On' : 'Image Colors: Off'}
            </Button>
            <Button
              onClick={onReset}
              size="sm"
              variant="outline"
              className="h-7 w-full border-neutral-500 bg-neutral-700 text-xs text-neutral-200 hover:bg-neutral-600"
            >
              Reset
            </Button>
            <Button
              onClick={onExport}
              disabled={isExporting}
              size="sm"
              className="h-7 w-full bg-[#e8945a] text-xs text-white hover:bg-[#d88550]"
            >
              {isExporting ? 'Exporting...' : 'Export OBJ'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}