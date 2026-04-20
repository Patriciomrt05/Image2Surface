import uuid
import numpy as np
from pathlib import Path
from typing import Optional
import cv2
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

import application

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
    vertex_colors: list = []

class SurfaceGenerateResponse(BaseModel):
    status: str
    mesh: Optional[MeshData] = None
    message: Optional[str] = None

class ExportRequest(BaseModel):
    image_id: str
    z_scale: float = 1.0
    smooth_strength: float = 5.0
    downsample_scale: float = 0.25
    scale_strength: float = 1.0
    sharpen_strength: float = 0.0

class ExportResponse(BaseModel):
    status: str
    filepath: Optional[str] = None
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
        
        application.uploaded_images[image_id] = {
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
    smooth_strength: float = Query(5.0),
    downsample_scale: float = Query(0.25)
):
    try:
        if image_id not in application.uploaded_images:
            raise HTTPException(status_code=404, detail="Image not found")
        
        image_path = application.uploaded_images[image_id]["filepath"]
        vertices, faces, normals, vertex_colors = application.generate_surface(
            image_id, image_path, z_scale, smooth_strength, downsample_scale
        )
        
        return {
            "status": "success",
            "mesh": {
                "vertices": vertices.tolist(),
                "indices": faces.tolist(),
                "vertex_colors": vertex_colors  # ← add this
            },
            "message": "Surface generated successfully"
        }
    except Exception as e:
        logger.error(f"Error generating surface: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/api/surface/export", response_model=ExportResponse)
async def export_surface(request: ExportRequest):
    try:
        filepath = application.export_mesh(
            request.image_id,
            request.z_scale,
            request.smooth_strength,
            request.downsample_scale,
            request.scale_strength,
            request.sharpen_strength
        )
        return {
            "status": "success",
            "filepath": filepath,
            "message": "Mesh exported successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error exporting mesh: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@app.on_event("startup")
async def startup_event():
    logger.info("Image2Surface API starting up")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)