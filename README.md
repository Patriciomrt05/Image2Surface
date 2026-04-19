# Image2Surface

Convert 2D images to interactive 3D surface meshes using AI-powered depth estimation (Depth Anything V2).

## Features

✨ **Image to 3D** - Convert any image to a 3D surface mesh
🎨 **Interactive Viewer** - Rotate, zoom, and inspect 3D models
✏️ **Live Editing** - Smooth, sharpen, and scale meshes in real-time
🚀 **Full Stack** - Modern web frontend + Python backend API
⚡ **Fast Inference** - GPU-accelerated depth estimation
🎯 **Web-Based** - No installation required for users

## Quick Start

### Option 1: Manual Setup (Recommended)

**Terminal 1 - Backend:**
```bash
# Create and activate virtual environment
python3 -m venv backend/venv
source backend/venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download model weights (first time only)
mkdir -p backend/checkpoints
curl -L -o backend/checkpoints/depth_anything_v2_vits.pth \
  https://huggingface.co/LiheYoung/depth_anything_v2/resolve/main/depth_anything_v2_vits.pth

# Start backend API (runs on http://localhost:8000)
cd backend
python server.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # Only needed first time
npm run dev
```

Then open http://localhost:3000

### Option 2: With Environment Variables

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

If not set, defaults to `http://localhost:8000/api`

## Architecture

```
Browser (Next.js Frontend)
        ↓
REST API (FastAPI Backend)
        ↓
- Image Upload
- Depth Estimation (Depth Anything V2)
- Mesh Generation
- Mesh Editing
        ↓
3D Viewer (Three.js WebGL)
```

## Technology Stack

### Backend
- **Python 3.8+**
- **FastAPI** - High-performance web framework
- **Uvicorn** - ASGI server
- **PyTorch** - Deep learning framework
- **OpenCV** - Image processing
- **NumPy** - Numerical computing

### Frontend
- **Next.js 14** - React meta-framework
- **TypeScript** - Type safety
- **React Three Fiber** - 3D with Three.js
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library

## Key Endpoints

**Backend API** (http://localhost:8000)

```
GET    /api/health              - Health check
POST   /api/image/upload        - Upload image
POST   /api/surface/generate    - Generate 3D mesh
POST   /api/surface/edit        - Apply mesh editing
POST   /api/surface/reset       - Reset mesh to original
```

API Documentation: http://localhost:8000/docs (Swagger UI)

## Workflow

1. **Upload** - Select a PNG/JPG image (max 5MB)
2. **Generate** - AI estimates depth and creates 3D mesh
3. **View** - Interact with the 3D model (rotate, zoom)
4. **Edit** - Apply adjustments:
   - Scale height
   - Smooth surface
   - Sharpen details
5. **Download** - Export as OBJ (coming soon)

## Performance

- **Upload**: 100-200ms
- **Generate** (GPU): 2-5s
- **Generate** (CPU): 30-60s
- **Edit**: 500-1000ms
- **Model size**: ~350MB (ViT-S)

## Requirements

### Minimum
- Python 3.8+
- Node.js 18+
- 4GB RAM
- 4GB disk space

### Recommended
- NVIDIA GPU with CUDA support (or Apple Silicon for MPS)
- 8GB+ RAM
- SSD for faster I/O

## Configuration

### Environment Variables

**Frontend** (.env.local):
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Backend** (environment):
```
DEVICE=cuda  # cuda, mps, or cpu
PORT=8000
```

## Build Models

- **Depth Anything V2** - Self-supervised vision transformer for monocular depth estimation
- **DINOv2** - Self-supervised vision transformer backbone
- **DPT** - Dense Prediction Transformer for depth-to-surface conversion

## Troubleshooting

**Backend won't start**: Ensure port 8000 is free
```bash
lsof -ti:8000 | xargs kill -9
```

**Model download fails**: Download manually to `backend/checkpoints/`

**Frontend shows "Backend not reachable"**: Check backend is running on port 8000

See [SETUP.md](SETUP.md#troubleshooting) for more solutions.

## Development

### Backend Development
```bash
cd backend
pip install -r ../requirements.txt
python -m pytest  # Run tests
python server.py --reload  # Hot reload
```

### Frontend Development
```bash
cd frontend
npm run dev       # Development server
npm run build     # Production build
npm run lint      # ESLint check
```

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project uses:
- **Depth Anything V2**: [CC-BY-SA-4.0](https://github.com/LiheYoung/Depth-Anything-V2)
- **DINOv2**: [CC-BY-NC 4.0](https://github.com/facebookresearch/dinov2)

## Credits

- Depth Anything V2: [LiheYoung](https://github.com/LiheYoung/Depth-Anything-V2)
- DINOv2: [Meta AI](https://github.com/facebookresearch/dinov2)
- 3D Visualization: [Threejs](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)

## Support

- 📖 [Setup Guide](SETUP.md)
- 📚 [API Docs](http://localhost:8000/docs) (when running)
- 🐛 [Issues](https://github.com/Patriciomrt05/Image2Surface/issues)

## Roadmap

- [ ] Model export (OBJ, STL, GLB)
- [ ] Batch processing
- [ ] Advanced editing tools
- [ ] Real-time preview improvements
- [ ] Mobile app
- [ ] Multi-image composition
- [ ] Point cloud export

---

Made with ❤️ for CS 5319 (Spring 2026)
