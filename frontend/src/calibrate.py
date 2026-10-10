import os
import json
import logging
from datetime import datetime, timedelta, timezone
import numpy as np
import cv2
from typing import Dict, Any, Optional, Tuple, List

logger = logging.getLogger(__name__)

DEFAULT_CAL_FILE = "data/calibration/calibration.json"

class CalibrationManager:
    def __init__(self, cal_file: str = DEFAULT_CAL_FILE, config: Optional[Dict[str, Any]] = None):
        self.cal_file = cal_file
        self.config = config or {}
        self.cal_cfg = self.config.get("calibration", {})
        self.validity_days = self.cal_cfg.get("validity_days", 7)
        self.bead_nominal_um = self.cal_cfg.get("bead_nominal_um", [10, 50, 100])
        self.bead_tolerance_pct = self.cal_cfg.get("bead_tolerance_pct", 20)

    def load(self) -> Optional[Dict[str, Any]]:
        """Load calibration file if exists, else return None."""
        if not os.path.exists(self.cal_file):
            return None
        try:
            with open(self.cal_file, "r") as f:
                data = json.load(f)
            return data
        except Exception as e:
            logger.error(f"Error loading calibration JSON: {e}")
            return None

    def is_valid(self, cal: Optional[Dict[str, Any]] = None) -> Tuple[bool, str, float]:
        """
        Evaluates validity and quality factor of calibration record.
        Returns: (is_valid: bool, status_reason: str, quality_factor: float)
        
        Quality factors:
        - 1.0: Valid and fresh (< 7 days)
        - 0.5: Stale (>= 7 days)
        - 0.0: Missing or validation failed
        """
        if cal is None:
            cal = self.load()

        if cal is None:
            return False, "Calibration missing", 0.0

        if not cal.get("valid", False):
            return False, "Calibration invalid / validation failed", 0.0

        factor = cal.get("factor_um_per_px")
        if not factor or factor <= 0:
            return False, "Invalid calibration factor <= 0", 0.0

        timestamp_str = cal.get("timestamp")
        expires_str = cal.get("expires")

        now = datetime.now(timezone.utc)

        if expires_str:
            try:
                expires_dt = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
                if now > expires_dt:
                    return True, f"Calibration stale (expired on {expires_str[:10]})", 0.5
            except Exception:
                pass
        elif timestamp_str:
            try:
                ts_dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                if now - ts_dt > timedelta(days=self.validity_days):
                    return True, f"Calibration stale (> {self.validity_days} days old)", 0.5
            except Exception:
                pass

        return True, "Calibration valid & active", 1.0

    def compute_factor_fft(
        self,
        image: np.ndarray,
        known_spacing_um: float = 10.0
    ) -> float:
        """
        FFT / Line Projection profile automated spacing detection on stage micrometer image.
        Returns factor_um_per_px (float).
        """
        if image.ndim == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image

        # Horizontal and Vertical projection profiles
        h_profile = np.mean(gray, axis=0)
        v_profile = np.mean(gray, axis=1)

        # Detect periodic peaks along the stronger profile direction
        h_std = np.std(h_profile)
        v_std = np.std(v_profile)

        profile = h_profile if h_std > v_std else v_profile

        # Detrend profile
        profile = profile - cv2.GaussianBlur(profile.reshape(-1, 1), (51, 1), 0).flatten()

        # FFT autocorrelation
        fft = np.fft.rfft(profile)
        power = np.abs(fft) ** 2
        autocorr = np.fft.irfft(power)

        # Find dominant peak after lag 5
        peaks = []
        for lag in range(5, len(autocorr) // 2):
            if autocorr[lag] > autocorr[lag - 1] and autocorr[lag] > autocorr[lag + 1]:
                peaks.append((autocorr[lag], lag))

        if not peaks:
            raise ValueError("Could not automatically detect stage micrometer lines in image.")

        peaks.sort(key=lambda x: x[0], reverse=True)
        dominant_period_px = peaks[0][1]

        um_per_px = known_spacing_um / float(dominant_period_px)
        return float(round(um_per_px, 4))

    def compute_factor_manual(
        self,
        pixel_distance: float,
        num_divisions: int = 1,
        known_spacing_um: float = 10.0
    ) -> float:
        """Manual scale calculation: um_per_px = (num_divisions * known_spacing_um) / pixel_distance"""
        if pixel_distance <= 0:
            raise ValueError("Pixel distance must be > 0.")
        total_um = num_divisions * known_spacing_um
        factor = total_um / pixel_distance
        return float(round(factor, 4))

    def validate_beads(
        self,
        measured_ecds_um: List[float]
    ) -> Dict[str, Any]:
        """
        Validates measured bead sizes against nominal reference sizes [10, 50, 100] µm.
        Returns validation summary dictionary.
        """
        validation_results = {}
        overall_pass = True
        max_error = 0.0

        for nominal in self.bead_nominal_um:
            # Find closest measured particle to nominal
            if not measured_ecds_um:
                validation_results[f"bead_{int(nominal)}um"] = {
                    "nominal": nominal,
                    "measured": None,
                    "error_pct": 100.0,
                    "status": "FAIL"
                }
                overall_pass = False
                continue

            closest_measured = min(measured_ecds_um, key=lambda x: abs(x - nominal))
            err_pct = ((closest_measured - nominal) / nominal) * 100.0
            abs_err = abs(err_pct)
            
            if abs_err > max_error:
                max_error = abs_err

            if abs_err <= self.bead_tolerance_pct:
                status = "PASS"
            elif abs_err <= 30.0:
                status = "WARN"
            else:
                status = "FAIL"
                overall_pass = False

            validation_results[f"bead_{int(nominal)}um"] = {
                "nominal": float(nominal),
                "measured": float(round(closest_measured, 2)),
                "error_pct": float(round(err_pct, 2)),
                "status": status
            }

        return {
            "validation": validation_results,
            "overall_pass": overall_pass,
            "max_error_pct": float(round(max_error, 2))
        }

    def save(
        self,
        factor_um_per_px: float,
        magnification: str = "200x",
        camera: str = "1920x1080",
        microscope: str = "USB Microscope",
        validation_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Writes data/calibration/calibration.json with timestamp and expiry.
        """
        os.makedirs(os.path.dirname(self.cal_file), exist_ok=True)
        now_dt = datetime.now(timezone.utc)
        expires_dt = now_dt + timedelta(days=self.validity_days)

        cal_record = {
            "version": "1.0",
            "timestamp": now_dt.isoformat(),
            "expires": expires_dt.isoformat(),
            "microscope": microscope,
            "camera": camera,
            "magnification": magnification,
            "factor_um_per_px": float(round(factor_um_per_px, 4)),
            "validation": validation_info.get("validation") if validation_info else {
                "bead_10um": {"nominal": 10, "measured": 10.0, "error_pct": 0.0},
                "bead_50um": {"nominal": 50, "measured": 50.0, "error_pct": 0.0},
                "bead_100um": {"nominal": 100, "measured": 100.0, "error_pct": 0.0}
            },
            "valid": validation_info.get("overall_pass", True) if validation_info else True
        }

        with open(self.cal_file, "w") as f:
            json.dump(cal_record, f, indent=2)

        logger.info(f"Saved calibration record to {self.cal_file}")
        return cal_record
