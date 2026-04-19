export interface ImageUploadResponse {
  success: boolean
  image_id: string
  message?: string
}

export interface HeightMap {
  width: number
  height: number
  data: number[][]
}

export interface Vertex {
  x: number
  y: number
  z: number
}

export interface Face {
  indices: [number, number, number]
}

export interface Mesh {
  vertices: Vertex[]
  faces: Face[]
}

export interface SurfaceResponse {
  success: boolean
  mesh: Mesh
  height_map?: HeightMap
  message?: string
}

export interface EditResponse {
  success: boolean
  mesh: Mesh
  message?: string
}

export interface ResetResponse {
  success: boolean
  mesh: Mesh | null
  message?: string
}

export interface HealthCheckResponse {
  status: string
  message?: string
}

export interface ApiError {
  success: false
  error: string
  message?: string
}

export type EditOperation = 'smooth' | 'sharpen' | 'scale'

export interface EditParams {
  operation: EditOperation
  intensity: number
}

export type AppScreen = 'upload' | 'viewer'

export type LoadingState = 
  | 'idle'
  | 'uploading'
  | 'generating'
  | 'editing'
  | 'resetting'

export interface AppState {
  screen: AppScreen
  selectedFile: File | null
  previewUrl: string | null
  imageId: string | null
  currentMesh: Mesh | null
  loadingState: LoadingState
  error: string | null
}
