import axios, { AxiosError } from 'axios'
import type {
  ImageUploadResponse,
  SurfaceResponse,
  EditResponse,
  ResetResponse,
  HealthCheckResponse,
  EditOperation,
  ApiError,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
})

let activeMeshRequest: AbortController | null = null

// Error handler helper
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>
    if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('cancelled')) {
      throw new Error('Request cancelled')
    }
    if (axiosError.response?.data?.detail) {
      throw new Error(axiosError.response.data.detail)
    }
    if (axiosError.response?.data?.message) {
      throw new Error(axiosError.response.data.message)
    }
    if (axiosError.message) {
      throw new Error(axiosError.message)
    }
  }
  throw new Error('An unexpected error occurred')
}

export function cancelPendingRequests() {
  if (activeMeshRequest) {
    activeMeshRequest.abort()
    activeMeshRequest = null
  }
}

/**
 * Upload an image file to the backend
 * Backend returns: { status: "success", image: { imageId, filename, width, height } }
 */
export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<any>('/image/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    // Transform backend response to frontend format
    if (response.data.status === 'success' && response.data.image) {
      return {
        success: true,
        image_id: response.data.image.imageId,
      }
    }

    throw new Error('Invalid response format')
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Generate a 3D surface from an uploaded image
 * Backend returns: { status: "success", mesh: { vertices: [[x,y,z], ...], indices: [[v0,v1,v2], ...] } }
 */
export async function generateSurface(imageId: string): Promise<SurfaceResponse> {
  try {
    // Cancel any previous request
    cancelPendingRequests()
    
    // Create new abort controller for this request
    activeMeshRequest = new AbortController()
    
    const response = await apiClient.post<any>(
      `/surface/generate?image_id=${encodeURIComponent(imageId)}`,
      {},
      { signal: activeMeshRequest.signal }
    )

    // Transform backend response to frontend format
    if (response.data.status === 'success' && response.data.mesh) {
      const backendMesh = response.data.mesh
      
      // Efficiently convert array-based vertices to object-based
      const vertices = backendMesh.vertices.map((v: number[]) => ({
        x: v[0],
        y: v[1],
        z: v[2],
      }))
      
      // Efficiently convert array-based indices to object-based
      const faces = backendMesh.indices.map((indices: number[]) => ({
        indices: [indices[0], indices[1], indices[2]],
      }))

      activeMeshRequest = null
      return {
        success: true,
        mesh: { vertices, faces },
      }
    }

    throw new Error('Invalid response format')
  } catch (error) {
    activeMeshRequest = null
    handleApiError(error)
  }
}

/**
 * Apply an edit operation to the current surface
 * Backend returns: { status: "success", mesh: { vertices: [...], indices: [...] } }
 */
export async function applyEdit(
  imageId: string,
  operation: EditOperation,
  intensity: number
): Promise<EditResponse> {
  try {
    // Cancel any previous mesh request
    cancelPendingRequests()
    
    // Create new abort controller for this request
    activeMeshRequest = new AbortController()
    
    const response = await apiClient.post<any>(
      '/surface/edit',
      {
        image_id: imageId,
        operation: operation,
        intensity: intensity,
      },
      { signal: activeMeshRequest.signal }
    )

    if (response.data.status === 'success' && response.data.mesh) {
      const backendMesh = response.data.mesh
      
      const vertices = backendMesh.vertices.map((v: number[]) => ({
        x: v[0],
        y: v[1],
        z: v[2],
      }))
      
      const faces = backendMesh.indices.map((indices: number[]) => ({
        indices: [indices[0], indices[1], indices[2]],
      }))

      activeMeshRequest = null
      return {
        success: true,
        mesh: { vertices, faces },
      }
    }

    throw new Error('Invalid response format')
  } catch (error) {
    activeMeshRequest = null
    handleApiError(error)
  }
}

/**
 * Reset the surface to its original state
 * Backend returns: { status: "success", mesh: { vertices: [...], indices: [...] } }
 */
export async function resetSurface(imageId: string): Promise<ResetResponse> {
  try {
    // Cancel any previous request
    cancelPendingRequests()
    
    // Create new abort controller for this request
    activeMeshRequest = new AbortController()
    
    const response = await apiClient.post<any>(
      `/surface/reset?image_id=${encodeURIComponent(imageId)}`,
      {},
      { signal: activeMeshRequest.signal }
    )

    if (response.data.status === 'success' && response.data.mesh) {
      const backendMesh = response.data.mesh
      
      const vertices = backendMesh.vertices.map((v: number[]) => ({
        x: v[0],
        y: v[1],
        z: v[2],
      }))
      
      const faces = backendMesh.indices.map((indices: number[]) => ({
        indices: [indices[0], indices[1], indices[2]],
      }))

      activeMeshRequest = null
      return {
        success: true,
        mesh: { vertices, faces },
      }
    }

    throw new Error('Invalid response format')
  } catch (error) {
    activeMeshRequest = null
    handleApiError(error)
  }
}

/**
 * Check backend health
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
  try {
    // Health check directly at API base
    const response = await axios.get<any>(
      `${API_BASE_URL.replace('/api', '')}/api/health`
    )
    return response.data
  } catch (error) {
    // For health check, return a failure status instead of throwing
    return { status: 'unavailable', message: 'Backend is not reachable' }
  }
}
