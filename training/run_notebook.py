"""Execute training/train_100_epochs.ipynb code cells in order (no Jupyter install needed).

Usage:  python training/run_notebook.py
"""

import json
import os
import time
from pathlib import Path

os.environ.setdefault("MPLBACKEND", "Agg")

def main():
    nb_path = Path(__file__).with_name("train_100_epochs.ipynb")
    nb = json.loads(nb_path.read_text(encoding="utf-8"))
    ns = {"__name__": "__main__", "__file__": str(nb_path)}

    for i, cell in enumerate(nb["cells"], 1):
        if cell["cell_type"] != "code":
            continue
        src = "".join(cell["source"])
        print(f"\n=== cell {i} ===", flush=True)
        t = time.time()
        exec(compile(src, f"{nb_path.name}:cell{i}", "exec"), ns)
        print(f"--- cell {i} finished in {time.time() - t:.1f}s", flush=True)


# Windows spawns DataLoader workers by re-importing __main__ — the guard stops
# them from re-running the notebook (RuntimeError: bootstrapping phase).
if __name__ == "__main__":
    main()
