import os
import cv2
import numpy as np
from PIL import Image
from typing import Union, Tuple, Dict, Any

def letterbox(
    img: np.ndarray,
    new_shape: Tuple[int, int] = (640, 640),
    color: Tuple[int, int, int] = (114, 114, 114),
    auto: bool = True,
    scale_fill: bool = False,
    scaleup: bool = True,
    stride: int = 32
) -> Tuple[np.ndarray, Tuple[float, float], Tuple[float, float]]:
    """
    Resize and pad image while meeting stride-multiple constraints.
    Returns:
        padded_img, (ratio_w, ratio_h), (dw, dh)
    """
    shape = img.shape[:2]  # current shape [height, width]
    if isinstance(new_shape, int):
        new_shape = (new_shape, new_shape)

    # Scale ratio (new / old)
    r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])
    if not scaleup:  # only scale down, do not scale up (for better test mAP)
        r = min(r, 1.0)

    # Compute padding
    ratio = (r, r)
    new_unpad = (int(round(shape[1] * r)), int(round(shape[0] * r)))
    dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]  # wh padding

    if auto:  # minimum rectangle
        dw, dh = np.mod(dw, stride), np.mod(dh, stride)
    elif scale_fill:  # stretch
        dw, dh = 0.0, 0.0
        new_unpad = (new_shape[1], new_shape[0])
        ratio = (new_shape[1] / shape[1], new_shape[0] / shape[0])

    dw /= 2  # divide padding into 2 sides
    dh /= 2

    if shape[::-1] != new_unpad:  # resize
        img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)

    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)
    return img, ratio, (dw, dh)


def load_image_rgb(source: Union[str, bytes, np.ndarray, Image.Image]) -> np.ndarray:
    """
    Load image from various input types into uint8 RGB NumPy array.
    """
    if isinstance(source, str):
        if not os.path.exists(source):
            raise FileNotFoundError(f"Image path not found: {source}")
        img_bgr = cv2.imread(source, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError(f"Failed to read image at: {source}")
        return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    elif isinstance(source, bytes):
        nparr = np.frombuffer(source, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Failed to decode image from bytes.")
        return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    elif isinstance(source, Image.Image):
        return np.array(source.convert("RGB"))

    elif isinstance(source, np.ndarray):
        if source.ndim == 2:
            return cv2.cvtColor(source, cv2.COLOR_GRAY2RGB)
        elif source.ndim == 3:
            if source.shape[2] == 4:
                return cv2.cvtColor(source, cv2.COLOR_RGBA2RGB)
            elif source.shape[2] == 3:
                return source.copy()
        raise ValueError(f"Invalid image array shape: {source.shape}")

    else:
        raise TypeError(f"Unsupported image input type: {type(source)}")


def apply_clahe_rgb(img_rgb: np.ndarray, clip_limit: float = 2.0, tile_grid: Tuple[int, int] = (8, 8)) -> np.ndarray:
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) on L channel in LAB color space.
    Preserves natural color / fluorescence while enhancing local microplastic edge contrast.
    """
    lab = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid)
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    return cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)


def preprocess_image(
    source: Union[str, bytes, np.ndarray, Image.Image],
    config: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Core Preprocessing Pipeline:
    1. Load image (RGB uint8)
    2. Median Blur (3x3)
    3. CLAHE (clipLimit=2.0)
    4. Letterbox resize to 640x640 RGB

    Returns dict with:
        - 'preprocessed': 640x640x3 uint8 RGB array
        - 'original': uint8 RGB array (original dimensions)
        - 'ratio': (ratio_w, ratio_h)
        - 'pad': (dw, dh)
        - 'original_shape': (orig_h, orig_w)
    """
    if config is None:
        config = {
            "preprocessing": {
                "median_blur_kernel": 3,
                "clahe_clip_limit": 2.0,
                "clahe_tile_grid": [8, 8]
            },
            "model": {"input_size": 640}
        }

    prep_cfg = config.get("preprocessing", {})
    kernel_size = prep_cfg.get("median_blur_kernel", 3)
    clip_limit = prep_cfg.get("clahe_clip_limit", 2.0)
    tile_grid = tuple(prep_cfg.get("clahe_tile_grid", [8, 8]))
    target_size = config.get("model", {}).get("input_size", 640)

    # 1. Load original image
    orig_rgb = load_image_rgb(source)
    orig_h, orig_w = orig_rgb.shape[:2]

    # 2. Median Blur for denoising
    if kernel_size > 1:
        # Ensure kernel is odd
        if kernel_size % 2 == 0:
            kernel_size += 1
        denoised = cv2.medianBlur(orig_rgb, kernel_size)
    else:
        denoised = orig_rgb.copy()

    # 3. Contrast enhancement via CLAHE
    enhanced = apply_clahe_rgb(denoised, clip_limit=clip_limit, tile_grid=tile_grid)

    # 4. Letterbox resize to 640x640
    prep_640, ratio, pad = letterbox(
        enhanced,
        new_shape=(target_size, target_size),
        color=(114, 114, 114),
        auto=False
    )

    # Save preview if string source provided and upload_dir configured
    if isinstance(source, str) and config.get("paths", {}).get("upload_dir"):
        try:
            upload_dir = config["paths"]["upload_dir"]
            os.makedirs(upload_dir, exist_ok=True)
            fname = os.path.basename(source)
            preview_path = os.path.join(upload_dir, f"pre_{fname}")
            cv2.imwrite(preview_path, cv2.cvtColor(prep_640, cv2.COLOR_RGB2BGR))
        except Exception:
            pass  # Non-blocking side effect

    return {
        "preprocessed": prep_640,
        "original": orig_rgb,
        "ratio": ratio,
        "pad": pad,
        "original_shape": (orig_h, orig_w)
    }
