"""
Modal app that renders Manim Python code to an mp4 and returns it base64-encoded.

Deploy:
    pip install modal
    modal token new                      # one-time auth
    modal deploy modal/manim_app.py

After deploy, Modal prints a public URL like:
    https://<username>--synap-manim-render-manim.modal.run/

Set that URL plus a shared secret in Next.js .env.local:
    MODAL_MANIM_URL=https://<username>--synap-manim-render-manim.modal.run/
    MODAL_MANIM_TOKEN=<a long random string>

The same MODAL_MANIM_TOKEN must be set as a Modal secret named "synap-manim":
    modal secret create synap-manim MODAL_MANIM_TOKEN=<same long random string>
"""

import base64
import os
import subprocess
import tempfile
from pathlib import Path

import modal
from fastapi.responses import JSONResponse

app = modal.App("synap-manim")

# Manim needs ffmpeg + LaTeX + Cairo to render. texlive-latex-extra is the
# minimum that covers most "math content" Manim scripts; texlive-full would
# work but is ~5GB and slow to spin up cold.
manim_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "ffmpeg",
        "libcairo2-dev",
        "libpango1.0-dev",
        "pkg-config",
        "texlive",
        "texlive-latex-extra",
        "texlive-fonts-extra",
        "texlive-science",
        "dvisvgm",
    )
    .pip_install("manim==0.18.1", "fastapi[standard]")
)


@app.function(
    image=manim_image,
    timeout=300,                       # max 5 min per render
    secrets=[modal.Secret.from_name("synap-manim")],
)
@modal.fastapi_endpoint(method="POST")
def render_manim(request: dict) -> dict:
    """
    Render a Manim scene.

    Input:
        { "code": "<python code defining a Scene subclass>",
          "scene_name": "MyScene",
          "quality": "l" | "m" | "h",   // optional, defaults to "l"
          "token": "<MODAL_MANIM_TOKEN>" }

    Output:
        { "video_b64": "<base64 mp4>", "scene_name": "MyScene" }
    """
    expected_token = os.environ.get("MODAL_MANIM_TOKEN")
    if not expected_token:
        return JSONResponse(status_code=500, content={"error": "Modal secret MODAL_MANIM_TOKEN is not set"})

    if request.get("token") != expected_token:
        return JSONResponse(status_code=401, content={"error": "unauthorized"})

    code = request.get("code")
    scene_name = request.get("scene_name", "Scene")
    quality = request.get("quality", "l")
    if quality not in ("l", "m", "h"):
        quality = "l"

    if not isinstance(code, str) or not code.strip():
        return JSONResponse(status_code=400, content={"error": "missing code"})

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        script = tmp / "scene.py"
        script.write_text(code)

        # `-q{quality}` chooses 480p15 / 720p30 / 1080p60.
        # `--media_dir` keeps all output inside the temp dir so we can find it.
        cmd = [
            "manim",
            f"-q{quality}",
            "--media_dir", str(tmp),
            "-o", "out",                     # name the file out.mp4
            str(script),
            scene_name,
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            return JSONResponse(
                status_code=500,
                content={
                    "error": "manim render failed",
                    "stderr": proc.stderr[-4000:],   # tail; full log can be huge
                    "stdout": proc.stdout[-2000:],
                    "code_preview": code[:500],
                },
            )

        # Manim drops the file at: <media_dir>/videos/<script_stem>/<resolution>/out.mp4
        candidates = list(tmp.glob("videos/**/out.mp4"))
        if not candidates:
            return JSONResponse(
                status_code=500,
                content={
                    "error": "render succeeded but output file not found",
                    "stdout": proc.stdout[-2000:],
                },
            )

        video_bytes = candidates[0].read_bytes()
        return {
            "video_b64": base64.b64encode(video_bytes).decode("ascii"),
            "scene_name": scene_name,
            "size_bytes": len(video_bytes),
        }
