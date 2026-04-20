import cv2
import os
import numpy as np
import processing
import editing
import storage

uploaded_images = {}

def generate_surface(image_id, image_path, z_scale, smooth_strength, downsample_scale):
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Could not read image")
    vertices, faces, normals, vertex_colors = processing.process_image(
        image,
        z_scale=z_scale,
        smooth_strength=int(smooth_strength),
        downsample_scale=downsample_scale
    )
    return vertices, faces, normals, vertex_colors

def export_mesh(image_id, z_scale, smooth_strength, downsample_scale, scale_strength=1.0, sharpen_strength=0.0):
    if image_id not in uploaded_images:
        raise ValueError("Image not found")

    image_path = uploaded_images[image_id]["filepath"]
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Could not read image")

    vertices, faces, normals, vertex_colors = processing.process_image(
        image,
        z_scale=z_scale,
        smooth_strength=int(smooth_strength),
        downsample_scale=downsample_scale
    )

    if scale_strength != 1.0:
        vertices = editing.scale_mesh(vertices, scale_strength)
    if sharpen_strength != 0.0:
        vertices = editing.sharpen_mesh(vertices, sharpen_strength)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(base_dir, '..', 'outputs', 'mesh.obj')
    output_path = os.path.normpath(output_path)
    storage.save_obj(output_path, vertices, faces, normals)
    return output_path