import cv2
import os
import processing

def save_obj(filename, vertices, faces, normals=None):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'w') as f:
        for v in vertices:
            f.write(f"v {v[0]} {v[1]} {v[2]}\n")
        if normals is not None:
            for n in normals:
                f.write(f"vn {n[0]} {n[1]} {n[2]}\n")
        for face in faces:
            if normals is not None:
                f.write(f"f {face[0]+1}//{face[0]+1} {face[1]+1}//{face[1]+1} {face[2]+1}//{face[2]+1}\n")
            else:
                f.write(f"f {face[0]+1} {face[1]+1} {face[2]+1}\n")

def generate_surface(image, z_scale, smooth_strength, downsample_scale):
    image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    vertices, faces, normals, vertex_colors = processing.process_image(
        image_bgr,
        z_scale=z_scale,
        smooth_strength=int(smooth_strength),
        downsample_scale=downsample_scale
    )
    return vertices, faces, normals, vertex_colors

def export_mesh(image, z_scale, smooth_strength, downsample_scale):
    vertices, faces, normals = generate_surface(
        image, z_scale, smooth_strength, downsample_scale
    )
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(base_dir, '..', 'outputs', 'mesh.obj')
    output_path = os.path.normpath(output_path)
    save_obj(output_path, vertices, faces, normals)
    return output_path