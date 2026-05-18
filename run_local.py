"""
NULL.OS — Offline Local Runner
Downloads TinyLlama to ./model_cache/ once, then starts the API.
Run: py -3.13 run_local.py
Then open: http://127.0.0.1:8000
"""
import os
import sys
import warnings
import subprocess
from pathlib import Path

warnings.filterwarnings("ignore")
import warnings
warnings.filterwarnings("ignore")


MODEL_ID  = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
CACHE_DIR = Path(__file__).parent / "model_cache"

def download_model():
    if (CACHE_DIR / "config.json").exists():
        print("[NULL.OS] Model already cached.")
        return
    print(f"[NULL.OS] Downloading {MODEL_ID} to {CACHE_DIR} ...")
    print("[NULL.OS] This is ~600MB and only happens once.\n")
    from huggingface_hub import snapshot_download
    snapshot_download(repo_id=MODEL_ID, local_dir=str(CACHE_DIR))
    print("[NULL.OS] Model downloaded.\n")

def start_server():
    env = os.environ.copy()
    env["TRANSFORMERS_CACHE"] = str(CACHE_DIR)
    env["HF_HOME"]            = str(CACHE_DIR)
    env["NULL_NO_MODEL"]      = "0"
    env["PYTHONWARNINGS"]     = "ignore"

    print("[NULL.OS] Starting server on http://127.0.0.1:8000")
    print("[NULL.OS] Open http://127.0.0.1:8000 in your browser.\n")

    # PyTorch does not support Python 3.13 on Windows yet — use 3.11
    python = "py" if sys.platform == "win32" else sys.executable
    python_args = ["-3.11"] if sys.platform == "win32" else []

    try:
        result = subprocess.run(
            [python, *python_args, "-m", "uvicorn", "backend.main:app",
             "--host", "127.0.0.1", "--port", "8000"],
            env=env,
        )
        if result.returncode != 0:
            print(f"[NULL.OS] Server exited with code {result.returncode}")
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    try:
        download_model()
    except Exception as e:
        print(f"[NULL.OS] Could not download model ({e}). Running with fallback responses.")
    start_server()
