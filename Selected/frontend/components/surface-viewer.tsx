'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { EditControls } from '@/components/edit-controls'
import type { Mesh } from '@/lib/types'

interface SurfaceViewerProps {
  mesh: Mesh | null
  isExporting: boolean
  showEditPanel: boolean
  imageId: string | null
  onToggleEditPanel: () => void
  onExport: (scaleStrength: number, smoothIntensity: number, sharpenIntensity: number) => void
  onResetView: () => void
  onBack: () => void
}

function CameraController({ resetTrigger }: { resetTrigger: number }) {
  const { camera } = useThree()
  useEffect(() => {
    if (resetTrigger > 0) {
      camera.position.set(0, 2, 5)
      camera.lookAt(0, 0, 0)
    }
  }, [resetTrigger, camera])
  return null
}

interface SurfaceMeshProps {
  mesh: Mesh
  heightScale: number
  smoothIntensity: number
  sharpenIntensity: number
  useImageColors: boolean
}

function SurfaceMesh({ mesh, heightScale, smoothIntensity, sharpenIntensity, useImageColors }: SurfaceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const previousGeometryRef = useRef<THREE.BufferGeometry | null>(null)

  const material = useMemo(() => {
    if (materialRef.current) materialRef.current.dispose()
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: useImageColors && !!mesh.vertexColors,
      side: THREE.DoubleSide,
      flatShading: false,
      // roughness: 0.5,
      // metalness: 0.1,
    })
    if (!useImageColors || !mesh.vertexColors) {
      mat.color = new THREE.Color('#8888aa')
    }
    materialRef.current = mat
    return mat
  }, [useImageColors, mesh.vertexColors])

  useEffect(() => {
    return () => {
      if (previousGeometryRef.current) previousGeometryRef.current.dispose()
      if (materialRef.current) materialRef.current.dispose()
    }
  }, [])

  const geometry = useMemo(() => {
    if (previousGeometryRef.current) previousGeometryRef.current.dispose()

    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(mesh.vertices.length * 3)

    const zValues = mesh.vertices.map(v => v.z)
    const zMean = zValues.reduce((a, b) => a + b, 0) / zValues.length
    const zStd = Math.sqrt(zValues.reduce((a, b) => a + Math.pow(b - zMean, 2), 0) / zValues.length)

    mesh.vertices.forEach((vertex, i) => {
      positions[i * 3] = vertex.x
      positions[i * 3 + 1] = vertex.y

      let z = vertex.z

      if (smoothIntensity > 0 && zStd > 0) {
        z = zMean + (z - zMean) * (1 - smoothIntensity)
      }
      if (sharpenIntensity > 0 && zStd > 0) {
        const smoothedZ = zMean + (z - zMean) * 0.5
        z = z + (z - smoothedZ) * sharpenIntensity
      }
      z = z * heightScale

      positions[i * 3 + 2] = z
    })

    const indices = new Uint32Array(mesh.faces.length * 3)
    mesh.faces.forEach((face, i) => {
      indices[i * 3] = face.indices[0]
      indices[i * 3 + 1] = face.indices[1]
      indices[i * 3 + 2] = face.indices[2]
    })

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setIndex(new THREE.BufferAttribute(indices, 1))

    // Add vertex colors if available and enabled
    if (useImageColors && mesh.vertexColors) {
      const colors = new Float32Array(mesh.vertices.length * 3)
      mesh.vertexColors.forEach((colorStr, i) => {
        const match = colorStr.match(/rgb\((\d+),(\d+),(\d+)\)/)
        if (match) {
          colors[i * 3] = parseInt(match[1]) / 255
          colors[i * 3 + 1] = parseInt(match[2]) / 255
          colors[i * 3 + 2] = parseInt(match[3]) / 255
        }
      })
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }

    geo.computeVertexNormals()
    previousGeometryRef.current = geo
    return geo
  }, [mesh, heightScale, smoothIntensity, sharpenIntensity, useImageColors])

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}

function PlaceholderMesh() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#555555" wireframe />
    </mesh>
  )
}

export function SurfaceViewer({
  mesh,
  isExporting,
  showEditPanel,
  imageId,
  onToggleEditPanel,
  onExport,
  onResetView,
  onBack,
}: SurfaceViewerProps) {
  const [mounted, setMounted] = useState(false)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [heightScale, setHeightScale] = useState(1.0)
  const [smoothIntensity, setSmoothIntensity] = useState(0.0)
  const [sharpenIntensity, setSharpenIntensity] = useState(0.0)
  const [useImageColors, setUseImageColors] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleResetView = () => {
    setResetTrigger((prev) => prev + 1)
    onResetView()
  }

  const handleReset = () => {
    setHeightScale(1.0)
    setSmoothIntensity(0.0)
    setSharpenIntensity(0.0)
    setUseImageColors(false)
  }

  const handleExport = () => {
    onExport(heightScale, smoothIntensity, sharpenIntensity)
  }

  if (!mounted) return null

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-[#c8c8c8] px-2 py-2">
      <h1 className="mb-2 font-serif text-2xl font-normal tracking-wide text-neutral-800">
        3D Surface Viewer
      </h1>

      <div className="relative w-full flex-1">
        <EditControls
          isOpen={showEditPanel}
          isExporting={isExporting}
          useImageColors={useImageColors}
          onToggle={onToggleEditPanel}
          onReset={handleReset}
          onExport={handleExport}
          onToggleImageColors={() => setUseImageColors(prev => !prev)}
          heightScale={heightScale}
          smoothIntensity={smoothIntensity}
          sharpenIntensity={sharpenIntensity}
          onHeightScaleChange={setHeightScale}
          onSmoothIntensityChange={setSmoothIntensity}
          onSharpenIntensityChange={setSharpenIntensity}
        />

        <div className="h-[calc(100vh-180px)] w-full overflow-hidden rounded-lg bg-[#1a1a1a]">
          <Canvas
            camera={{ position: [0, 2, 5], fov: 50 }}
            gl={{
              antialias: true,
              powerPreference: 'high-performance',
              preserveDrawingBuffer: false,
              stencil: false,
              depth: true,
            }}
          >
            <CameraController resetTrigger={resetTrigger} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, 3, -5]} intensity={0.4} />
            {mesh ? (
              <SurfaceMesh
                mesh={mesh}
                heightScale={heightScale}
                smoothIntensity={smoothIntensity}
                sharpenIntensity={sharpenIntensity}
                useImageColors={useImageColors}
              />
            ) : (
              <PlaceholderMesh />
            )}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1}
              maxDistance={20}
            />
          </Canvas>
        </div>

        <div className="mt-1 text-right text-xs text-neutral-600">
          <p>Rotate: click + drag</p>
          <p>Zoom: scroll</p>
        </div>
      </div>

      <div className="mt-2 flex gap-4">
        <Button
          onClick={handleResetView}
          className="bg-[#e8945a] px-6 py-2 text-sm font-medium text-white hover:bg-[#d88550]"
        >
          Reset View
        </Button>
        <Button
          onClick={onBack}
          className="bg-[#e8945a] px-6 py-2 text-sm font-medium text-white hover:bg-[#d88550]"
        >
          Back
        </Button>
      </div>
    </div>
  )
}