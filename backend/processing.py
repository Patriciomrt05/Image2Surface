import torch
import cv2
import numpy as np
import sys
import os
sys.path.append('depth_anything_v2')
from depth_anything_v2.dpt import DepthAnythingV2

DEVICE = 'cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu'

model_configs = {
    'vits': {'encoder': 'vits', 'features': 64, 'out_channels': [48, 96, 192, 384]},
    'vitb': {'encoder': 'vitb', 'features': 128, 'out_channels': [96, 192, 384, 768]},
    'vitl': {'encoder': 'vitl', 'features': 256, 'out_channels': [256, 512, 1024, 1024]},
    'vitg': {'encoder': 'vitg', 'features': 384, 'out_channels': [1536, 1536, 1536, 1536]}
}

def load_model(encoder='vits'):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    checkpoint_path = os.path.join(base_dir, 'checkpoints', f'depth_anything_v2_{encoder}.pth')
    model = DepthAnythingV2(**model_configs[encoder])
    model.load_state_dict(torch.load(checkpoint_path, map_location='cpu'))
    return model.to(DEVICE).eval()

model = load_model()

def estimate_depth(model, image):
    return model.infer_image(image)

def downsample_depth(depth, scale=0.25):
    return cv2.resize(depth, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

# def smooth_depth(depth, strength=5):
#     return cv2.GaussianBlur(depth, (strength, strength), 0)

def filter_noise(depth, strength=5):
    return cv2.medianBlur(depth.astype(np.float32), strength)

def normalize_depth(depth):
    return (depth - depth.min()) / depth.max()

def scale_height(depth, z_scale=1.0):
    return depth * z_scale

def compute_vertices(depth):
    h, w = depth.shape
    vertices = []
    for y in range(h):
        for x in range(w):
            z = depth[y, x]
            vertices.append([x, y, z])
    return np.array(vertices, dtype=np.float32), h, w

def flip_y_axis(vertices):
    vertices = vertices.copy()
    vertices[:, 1] *= -1
    return vertices

def center_mesh(vertices):
    vertices = vertices.copy()
    min_vals = vertices.min(axis=0)
    max_vals = vertices.max(axis=0)
    center = (min_vals + max_vals) / 2
    vertices -= center
    return vertices

def normalize_coordinate_space(vertices):
    # Find the largest range across all axes
    min_vals = vertices.min(axis=0)
    max_vals = vertices.max(axis=0)
    ranges = max_vals - min_vals
    max_range = ranges.max()

    # Scale all axes by the same factor to preserve shape
    vertices = vertices / (max_range / 2)

    return vertices

def compute_faces(h, w):
    faces = []
    def idx(x, y):
        return y * w + x
    for y in range(h-1):
        for x in range(w-1):
            v0 = idx(x, y)
            v1 = idx(x + 1, y)
            v2 = idx(x, y + 1)
            v3 = idx(x + 1, y + 1)
            faces.append([v0, v1, v2])
            faces.append([v1, v3, v2])
    return np.array(faces, dtype=np.int32)

def compute_normals(vertices, faces):
    vertex_normals = np.zeros_like(vertices)
    v0 = vertices[faces[:, 0]]
    v1 = vertices[faces[:, 1]]
    v2 = vertices[faces[:, 2]]
    edge1 = v1 - v0
    edge2 = v2 - v0
    face_normals = np.cross(edge1, edge2)
    for i in range(3):
        np.add.at(vertex_normals, faces[:, i], face_normals)
    lengths = np.linalg.norm(vertex_normals, axis=1, keepdims=True)
    lengths = np.where(lengths == 0, 1, lengths)
    vertex_normals /= lengths
    return vertex_normals

def sample_vertex_colors(image, depth_shape):
    h, w = depth_shape
    resized = cv2.resize(image, (w, h), interpolation=cv2.INTER_AREA)
    resized_rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    
    colors = []
    for y in range(h):
        for x in range(w):
            r, g, b = resized_rgb[y, x]
            colors.append(f'rgb({r},{g},{b})')
    return colors

def process_image(image, z_scale=1.0, filter_strength=5, downsample_scale=0.25):
    depth = estimate_depth(model, image)
    depth = downsample_depth(depth, scale=downsample_scale)
    vertex_colors = sample_vertex_colors(image, depth.shape)
    depth = filter_noise(depth, strength=filter_strength)
    depth = normalize_depth(depth)
    depth = scale_height(depth, z_scale=z_scale)
    vertices, h, w = compute_vertices(depth)
    vertices = flip_y_axis(vertices)
    vertices = center_mesh(vertices)
    vertices = normalize_coordinate_space(vertices)
    faces = compute_faces(h, w)
    normals = compute_normals(vertices, faces)
    return vertices, faces, normals, vertex_colors
