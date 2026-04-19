'use client'

import React, { useRef, useMemo, useEffect, useCallback, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { EditControls } from '@/components/edit-controls'
import type { Mesh, EditOperation } from '@/lib/types'

interface SurfaceViewerProps {
  mesh: Mesh | null
  isEditing: boolean
  showEditPanel: boolean
  onToggleEditPanel: () => void
  onApplyEdit: (operation: EditOperation, intensity: number) => void
  onReset: () => void
  onResetView: () => void
  onBack: () => void
}



function SurfaceMesh({ mesh }: { mesh: Mesh }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const previousGeometryRef = useRef<THREE.BufferGeometry | null>(null)
  const [geometryReady, setGeometryReady] = useState(false)

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#8888aa',
      side: THREE.DoubleSide,
      flatShading: false,
    })
    materialRef.current = mat
    return mat
  }, [])

  useEffect(() => {
    return () => {
      if (previousGeometryRef.current) {
        previousGeometryRef.current.dispose()
      }
      if (materialRef.current) {
        materialRef.current.dispose()
      }
    }
  }, [])

  const geometry = useMemo(() => {
    setGeometryReady(false)
    
    if (previousGeometryRef.current) {
      previousGeometryRef.current.dispose()
    }

    const geo = new THREE.BufferGeometry()
    
    // Create positions array
    const positions = new Float32Array(mesh.vertices.length * 3)
    mesh.vertices.forEach((vertex, i) => {
      positions[i * 3] = vertex.x
      positions[i * 3 + 1] = vertex.y
      positions[i * 3 + 2] = vertex.z * 10
    })

    // Create indices array
    const indices = new Uint32Array(mesh.faces.length * 3)
    mesh.faces.forEach((face, i) => {
      indices[i * 3] = face.indices[0]
      indices[i * 3 + 1] = face.indices[1]
      indices[i * 3 + 2] = face.indices[2]
    })

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setIndex(new THREE.BufferAttribute(indices, 1))
    
    // Defer expensive computations to requestIdleCallback
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(() => {
        geo.computeVertexNormals()
        geo.computeBoundingBox()
        if (geo.boundingBox) {
          const center = new THREE.Vector3()
          geo.boundingBox.getCenter(center)
          geo.translate(-center.x, -center.y, -center.z)
        }
        geo.computeBoundingSphere()
        if (geo.boundingSphere) {
          const scale = 2 / geo.boundingSphere.radius
          geo.scale(scale, scale, scale)
        }
        setGeometryReady(true)
      })
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => {
        geo.computeVertexNormals()
        geo.computeBoundingBox()
        if (geo.boundingBox) {
          const center = new THREE.Vector3()
          geo.boundingBox.getCenter(center)
          geo.translate(-center.x, -center.y, -center.z)
        }
        geo.computeBoundingSphere()
        if (geo.boundingSphere) {
          const scale = 2 / geo.boundingSphere.radius
          geo.scale(scale, scale, scale)
        }
        setGeometryReady(true)
      }, 0)
    }

    previousGeometryRef.current = geo
    return geo
  }, [mesh])

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  )
}

const PlaceholderMesh = () => {
  const geometryRef = useRef<THREE.BoxGeometry | null>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null)

  useEffect(() => {
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose()
      }
      if (materialRef.current) {
        materialRef.current.dispose()
      }
    }
  }, [])

  const geometry = useMemo(() => {
    geometryRef.current = new THREE.BoxGeometry(1, 1, 1)
    return geometryRef.current
  }, [])

  const material = useMemo(() => {
    materialRef.current = new THREE.MeshStandardMaterial({
      color: '#555555',
      wireframe: true,
    })
    return materialRef.current
  }, [])

  return (
    <mesh geometry={geometry} material={material} />
  )
}

function CameraController({ resetTrigger }: { resetTrigger: number }) {
  const { camera, invalidate } = useThree()
  
  useEffect(() => {
    if (resetTrigger > 0) {
      camera.position.set(0, 2, 5)
      camera.lookAt(0, 0, 0)
      invalidate()
    }
  }, [resetTrigger, camera, invalidate])
  
  return null
}

const MemoizedCameraController = React.memo(CameraController)
const MemoizedPlaceholderMesh = React.memo(PlaceholderMesh)

function MemoizedSurfaceMeshWrapper({ mesh }: { mesh: Mesh }) {
  return <SurfaceMesh mesh={mesh} />
}

const CachedSurfaceMesh = React.memo(MemoizedSurfaceMeshWrapper)

export function SurfaceViewer({
  mesh,
  isEditing,
  showEditPanel,
  onToggleEditPanel,
  onApplyEdit,
  onReset,
  onResetView,
  onBack,
}: SurfaceViewerProps) {
  const [resetTrigger, setResetTrigger] = useState(0)

  const glConfig = useMemo(() => ({
    antialias: true,
    powerPreference: 'high-performance' as const,
    preserveDrawingBuffer: false,
    stencil: false,
    depth: true,
  }), [])

  const cameraPosition = useMemo(() => [0, 2, 5] as const, [])

  const handleResetView = () => {
    setResetTrigger((prev) => prev + 1)
    onResetView()
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-[#c8c8c8] px-2 py-2">
      <h1 className="mb-2 font-serif text-2xl font-normal tracking-wide text-neutral-800">
        3D Surface Viewer
      </h1>

      <div className="relative w-full flex-1">
        <EditControls
          isOpen={showEditPanel}
          isEditing={isEditing}
          onToggle={onToggleEditPanel}
          onApplyEdit={onApplyEdit}
          onReset={onReset}
        />

        <div className="h-[calc(100vh-180px)] w-full overflow-hidden rounded-lg bg-[#1a1a1a]">
          <Canvas
            camera={{ position: cameraPosition, fov: 50 }}
            gl={glConfig}
            frameloop="demand"
          >
            <MemoizedCameraController resetTrigger={resetTrigger} />
            
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, 3, -5]} intensity={0.4} />
            
            {mesh ? <CachedSurfaceMesh mesh={mesh} /> : <MemoizedPlaceholderMesh />}
            
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

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center rounded-lg bg-neutral-800 px-8 py-6 text-white">
            <div className="mb-3 size-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Applying edit...</span>
          </div>
        </div>
      )}
    </div>
  )
}
