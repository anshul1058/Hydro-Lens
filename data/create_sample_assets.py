import os
import cv2
import numpy as np

def generate_sample_assets():
    os.makedirs("data/reference", exist_ok=True)
    os.makedirs("data/uploads", exist_ok=True)
    os.makedirs("data/results", exist_ok=True)
    os.makedirs("models", exist_ok=True)

    # 1. Demo Microplastics Microscope Image (640x640)
    bg = np.full((640, 640, 3), (230, 235, 230), dtype=np.uint8)
    
    # Add subtle filter texture / noise
    noise = np.random.normal(0, 8, (640, 640, 3)).astype(np.int16)
    bg = np.clip(bg.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Particle 1: Irregular blue fragment
    pts1 = np.array([[180, 200], [240, 190], [270, 250], [210, 270], [160, 240]], np.int32)
    cv2.fillPoly(bg, [pts1], (180, 80, 20)) # BGR: Blueish
    cv2.polylines(bg, [pts1], True, (120, 50, 10), 2)

    # Particle 2: Red fiber
    pts2 = np.array([[380, 120], [400, 180], [430, 260], [450, 310]], np.int32)
    cv2.polylines(bg, [pts2], False, (40, 40, 220), 4)

    # Particle 3: Green film candidate
    pts3 = np.array([[120, 420], [190, 410], [210, 480], [130, 500]], np.int32)
    cv2.fillPoly(bg, [pts3], (80, 180, 80))
    
    # Particle 4: Small bead candidate (10-25 µm equivalent)
    cv2.circle(bg, (480, 450), 18, (30, 140, 200), -1)

    cv2.imwrite("data/reference/demo_microplastic_sample.jpg", bg)

    # 2. Stage Micrometer Scale Image
    mic = np.full((400, 800, 3), (245, 245, 245), dtype=np.uint8)
    # Draw horizontal baseline
    cv2.line(mic, (50, 200), (750, 200), (40, 40, 40), 2)
    
    # Draw 25 vertical scale division lines spaced 24 pixels apart (representing 10 µm each)
    for i in range(26):
        x = 50 + i * 24
        h = 40 if i % 5 == 0 else 20
        cv2.line(mic, (x, 200 - h), (x, 200 + h), (20, 20, 20), 2 if i % 5 == 0 else 1)
        if i % 5 == 0:
            cv2.putText(mic, f"{i*10}um", (x - 15, 200 - 50), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (50, 50, 50), 1)

    cv2.imwrite("data/reference/stage_micrometer_scale.png", mic)

    # 3. Blank Filter Control
    blank = np.full((640, 640, 3), (235, 238, 235), dtype=np.uint8)
    blank_noise = np.random.normal(0, 5, (640, 640, 3)).astype(np.int16)
    blank = np.clip(blank.astype(np.int16) + blank_noise, 0, 255).astype(np.uint8)
    cv2.imwrite("data/reference/blank_filter_control.png", blank)

    print("Sample reference assets created successfully.")

if __name__ == "__main__":
    generate_sample_assets()
