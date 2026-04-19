import os
import uuid
import numpy as np
from pathlib import Path
from typing import Optional
import cv2
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

import processing

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Image2Surface API",
    description="Convert images to 3D surfaces using depth estimation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

uploaded_images = {}
generated_meshes = {}


class HealthResponse(BaseModel):
    status: str
    message: str


class ImageUploadResponse(BaseModel):
    status: str
    image: Optional[dict] = None
    message: Optional[str] = None


class MeshData(BaseModel):
    vertices: list
    indices: list


class SurfaceGenerateResponse(BaseModel):
    status: str
    mesh: Optional[MeshData] = None
    message: Optional[str] = None


class EditRequest(BaseModel):
    image_id: str
    operation: str
    intensity: float = 1.0


class EditResponse(BaseModel):
    status: str
    mesh: Optional[MeshData] = None
    message: Optional[str] = None


class ResetResponse(BaseModel):
    status: str
    mesh: Optional[MeshData] = None
    message: Optional[str] = None


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "healthy",
        "message": "Image2Surface API is running"
    }


@app.post("/api/image/upload", response_model=ImageUploadResponse)
async def upload_image(file: UploadFile = File(...)):
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        image_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{image_id}.png"
        
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        image_array = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
        height, width = image_array.shape[:2]
        
        uploaded_images[image_id] = {
            "filepath": str(file_path),
            "width": width,
            "height": height,
            "original_name": file.filename
        }
        
        return {
            "status": "success",
            "image": {
                "imageId": image_id,
                "filename": file.filename,
                "width": width,
                "height": height
            },
            "message": f"Image uploaded successfully: {file.filename}"
        }
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.post("/api/surface/generate", response_model=SurfaceGenerateResponse)
async def generate_surface(
    image_id: str = Query(...),
    z_scale: float = Query(1.0),
    smooth_strength: float = Query(1.0),
    downsample_scale: float = Query(0.25)
):
    try:
        if image_id not in uploaded_images:
            raise HTTPException(status_code=404, detail="Image not found")
        
        image_path = uploaded_images[image_id]["filepath"]
        image = cv2.imread(image_path)
        
        if image is None:
            raise HTTPException(status_code=500, detail="Could not read image")
        
        vertices, faces, normals, vertex_colors = processing.process_image(
            image,
            z_scale=z_scale,
            smooth_strength=int(smooth_strength),
            downsample_scale=downsample_scale
        )
        
        vertices_list = vertices.tolist() if isinstance(vertices, np.ndarray) else vertices
        faces_list = faces.tolist() if isinstance(faces, np.ndarray) else faces
        
        generated_meshes[image_id] = {
            "vertices": vertices,
            "indices": faces,
            "original_vertices": vertices.copy() if isinstance(vertices, np.ndarray) else np.array(vertices),
            "edits": []
        }
        
        return {
            "status": "success",
            "mesh": {
                "vertices": vertices_list,
                "indices": faces_list
            },
            "message": "Surface generated successfully"
        }
    except Exception as e:
        logger.error(f"Error generating surface: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.post("/api/surface/edit", response_model=EditResponse)
async def edit_surface(request: EditRequest):
    try:
        image_id = request.image_id
        operation = request.operation
        strength = request.intensity
        
        if image_id not in generated_meshes:
            raise HTTPException(status_code=404, detail="Mesh not found")
        
        mesh = generated_meshes[image_id]
        
        # Always start from original vertices, not modified ones
        vertices = mesh["original_vertices"].copy() if isinstance(mesh["original_vertices"], np.ndarray) else np.array(mesh["original_vertices"])
        
        # Apply the new operation
        if operation == "smooth":
            vertices = _smooth_mesh(vertices, strength)
        elif operation == "sharpen":
            vertices = _sharpen_mesh(vertices, strength)
        elif operation == "scale":
            vertices = _scale_mesh(vertices, strength)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown operation: {operation}")
        
        # Store the current state for display, but keep original intact
        mesh["vertices"] = vertices.copy() if isinstance(vertices, np.ndarray) else vertices
        mesh["edits"] = [operation, strength]
        
        return {
            "status": "success",
            "mesh": {
                "vertices": vertices.tolist() if isinstance(vertices, np.ndarray) else vertices,
                "indices": mesh["indices"].tolist() if isinstance(mesh["indices"], np.ndarray) else mesh["indices"]
            },
            "message": f"Mesh {operation} applied"
        }
    except Exception as e:
        logger.error(f"Error editing surface: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Edit failed: {str(e)}")


@app.post("/api/surface/reset", response_model=ResetResponse)
async def reset_surface(image_id: str = Query(...)):
    try:
        if image_id not in generated_meshes:
            raise HTTPException(status_code=404, detail="Mesh not found")
        
        mesh = generated_meshes[image_id]
        mesh["vertices"] = mesh["original_vertices"].copy() if isinstance(mesh["original_vertices"], np.ndarray) else mesh["original_vertices"]
        
        return {
            "status": "success",
            "mesh": {
                "vertices": mesh["vertices"].tolist() if isinstance(mesh["vertices"], np.ndarray) else mesh["vertices"],
                "indices": mesh["indices"].tolist() if isinstance(mesh["indices"], np.ndarray) else mesh["indices"]
            },
            "message": "Mesh reset to original"
        }
    except Exception as e:
        logger.error(f"Error resetting surface: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")


def _smooth_mesh(vertices, strength=1.0):
    """Smooth mesh by reducing height variations"""
    smoothed = vertices.copy()
    strength = min(max(strength, 0), 1)
    z_values = smoothed[:, 2]
    z_mean = z_values.mean()
    z_std = z_values.std()
    
    if z_std > 0:
        smoothed[:, 2] = z_mean + (z_values - z_mean) * (1 - strength)
    
    return smoothed


def _sharpen_mesh(vertices, strength=1.0):
    """Sharpen mesh by exaggerating height variations"""
    sharpened = vertices.copy()
    min_z = sharpened[:, 2].min()
    max_z = sharpened[:, 2].max()
    mid_z = (min_z + max_z) / 2
    sharpened[:, 2] = mid_z + (sharpened[:, 2] - mid_z) * (1 + strength)
    
    return sharpened


def _scale_mesh(vertices, strength=1.0):
    """Scale mesh height (Z values)"""
    scaled = vertices.copy()
    scaled[:, 2] = scaled[:, 2] * strength
    return scaled


@app.on_event("startup")
async def startup_event():
    logger.info("Image2Surface API starting up")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
