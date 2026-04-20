import numpy as np

def smooth_mesh(vertices, strength=1.0):
    smoothed = vertices.copy()
    strength = min(max(strength, 0), 1)
    z_values = smoothed[:, 2]
    z_mean = z_values.mean()
    z_std = z_values.std()
    if z_std > 0:
        smoothed[:, 2] = z_mean + (z_values - z_mean) * (1 - strength)
    return smoothed

def sharpen_mesh(vertices, strength=1.0):
    sharpened = vertices.copy()
    z_values = sharpened[:, 2]
    z_mean = z_values.mean()
    z_std = z_values.std()
    if z_std > 0:
        smoothed_z = z_mean + (z_values - z_mean) * 0.5
        sharpened[:, 2] = z_values + (z_values - smoothed_z) * strength
    return sharpened

def scale_mesh(vertices, strength=1.0):
    scaled = vertices.copy()
    scaled[:, 2] = scaled[:, 2] * strength
    return scaled