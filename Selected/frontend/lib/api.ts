import axios, { AxiosError } from 'axios'
import type {
  ImageUploadResponse,
  SurfaceResponse,
  HealthCheckResponse,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
})

let activeMeshRequest: AbortController | null = null

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

export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<any>('/image/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    if (response.data.status === 'success' && response.data.image) {
      return { success: true, image_id: response.data.image.imageId }
    }
    throw new Error('Invalid response format')
  } catch (error) {
    handleApiError(error)
  }
}

export async function generateSurface(
  imageId: string,
  downsampleScale: number = 0.25,
  smoothStrength: number = 5,
  zScale: number = 1.0
): Promise<SurfaceResponse> {
  try {
    cancelPendingRequests()
    activeMeshRequest = new AbortController()

    const response = await apiClient.post<any>(
      `/surface/generate?image_id=${encodeURIComponent(imageId)}&downsample_scale=${downsampleScale}&smooth_strength=${smoothStrength}&z_scale=${zScale}`,
      {},
      { signal: activeMeshRequest.signal }
    )

    if (response.data.status === 'success' && response.data.mesh) {
      const backendMesh = response.data.mesh
      const vertices = backendMesh.vertices.map((v: number[]) => ({
        x: v[0], y: v[1], z: v[2],
      }))
      const faces = backendMesh.indices.map((indices: number[]) => ({
        indices: [indices[0], indices[1], indices[2]],
      }))
      const vertexColors = backendMesh.vertex_colors || null

      activeMeshRequest = null
      return { success: true, mesh: { vertices, faces, vertexColors } }
    }

    throw new Error('Invalid response format')
  } catch (error) {
    activeMeshRequest = null
    handleApiError(error)
  }
}

export async function exportMesh(
  imageId: string,
  zScale: number,
  smoothStrength: number,
  downsampleScale: number,
  scaleStrength: number,
  sharpenStrength: number
): Promise<{ success: boolean; filepath?: string; message?: string }> {
  try {
    const response = await apiClient.post<any>('/surface/export', {
      image_id: imageId,
      z_scale: zScale,
      smooth_strength: smoothStrength,
      downsample_scale: downsampleScale,
      scale_strength: scaleStrength,
      sharpen_strength: sharpenStrength,
    })
    if (response.data.status === 'success') {
      return { success: true, filepath: response.data.filepath, message: response.data.message }
    }
    throw new Error('Invalid response format')
  } catch (error) {
    handleApiError(error)
  }
}

export async function healthCheck(): Promise<HealthCheckResponse> {
  try {
    const response = await axios.get<any>(`${API_BASE_URL.replace('/api', '')}/api/health`)
    return response.data
  } catch (error) {
    return { status: 'unavailable', message: 'Backend is not reachable' }
  }
}