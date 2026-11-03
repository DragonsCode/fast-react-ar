import json
import logging
import os
import re
import tempfile
import uuid
from pathlib import Path
from typing import Annotated

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

logger = logging.getLogger(__name__)
MAX_MODEL_BYTES = int(os.environ.get("MAX_MODEL_BYTES", str(25 * 1024 * 1024)))
if MAX_MODEL_BYTES <= 0:
    raise ValueError("MAX_MODEL_BYTES must be positive")
MODEL_ID_PATTERN = re.compile(r"[A-Za-z0-9_-]{1,64}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Path to models database file
MODELS_DB_FILE = "models_db.json"

def load_models_db():
    """Load models from JSON file"""
    if os.path.exists(MODELS_DB_FILE):
        with open(MODELS_DB_FILE) as f:
            return json.load(f)
    return {}

def save_models_db(db):
    """Replace the single-worker registry without truncating it on write failure."""
    destination = Path(MODELS_DB_FILE)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=destination.parent,
            prefix=f".{destination.name}.", suffix=".tmp", delete=False,
        ) as stream:
            temporary = Path(stream.name)
            json.dump(db, stream, indent=2)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, destination)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


async def read_model_file(upload):
    """Bound memory even when a client omits or lies about its content length."""
    content = bytearray()
    while True:
        chunk = await upload.read(min(64 * 1024, MAX_MODEL_BYTES + 1 - len(content)))
        if not chunk:
            return bytes(content)
        content.extend(chunk)
        if len(content) > MAX_MODEL_BYTES:
            raise HTTPException(status_code=413, detail="Model file exceeds the configured size limit")

def validate_model_file(filename: str, content: bytes) -> bool:
    """Validate if file is a valid 3D model"""
    if filename.endswith('.glb'):
        # GLB files start with 'glTF'
        return content[:4] == b'glTF'
    elif filename.endswith('.usdz'):
        # USDZ files are ZIP archives, start with 'PK'
        return content[:2] == b'PK'
    return False

# === НАСТРОЙКИ ===
# Сюда вставьте ваш текущий домен Ngrok (без слеша в конце)
# Если используете локально, оставьте http://localhost:8000
BASE_URL = "https://apiar.dragonscode.uz" 

# База данных (in-memory + file backup)
models_db = load_models_db()

# Default models if database is empty
if not models_db:
    models_db = {
        # Кейс 1: Внешняя ссылка (Интернет)
        "test": {
            "title": "Тестовая модель (Интернет)",
            "src": "https://ar-code.com/files/AR-Code-1678083479767.glb",
            "ios_src": "https://ar-code.com/files/AR-Code-1678083479767.usdz"
        },
        # Кейс 2: Локальный файл (лежит в папке backend/static)
        "local": {
            "title": "Локальная рамка",
            "src": "frame_red.glb",
            "ios_src": "frame_red.usdz"
        },
        "astro": {
            "title": "Тестовый Астронавт",
            "src": "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
            "ios_src": "https://modelviewer.dev/shared-assets/models/Astronaut.usdz"
        },
        "stool": {
            "title": "Тестовый Табурет",
            "src": "https://modelviewer.dev/assets/ShopifyModels/Chair.glb",
            "ios_src": "https://modelviewer.dev/assets/ShopifyModels/Chair.glb"
        },
        "niel": {
            "title": "Тестовый Нильс",
            "src": "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb",
            "ios_src": "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb"
        }
    }

class ARResponse(BaseModel):
    title: str
    src: str
    ios_src: str

@app.get("/api/model/{item_id}", response_model=ARResponse)
async def get_model(item_id: str):
    item = models_db.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # --- ЛОГИКА ГЕНЕРАЦИИ ССЫЛКИ ---
    src = item['src']
    ios_src = item['ios_src']

    # Если ссылка НЕ начинается на http, значит она локальная -> приклеиваем наш домен
    if not src.startswith("http"):
        src = f"{BASE_URL}/static/{src}"
    
    if not ios_src.startswith("http"):
        ios_src = f"{BASE_URL}/static/{ios_src}"

    return {
        "title": item["title"],
        "src": src,         # Отдаем готовую полную ссылку
        "ios_src": ios_src  # Отдаем готовую полную ссылку
    }

@app.get("/api/models")
async def list_models():
    """Get list of all available models with their full URLs"""
    models_list = []
    for model_id, item in models_db.items():
        src = item['src']
        ios_src = item['ios_src']
        
        # Generate full URLs for local files
        if not src.startswith("http"):
            src = f"{BASE_URL}/static/{src}"
        
        if not ios_src.startswith("http"):
            ios_src = f"{BASE_URL}/static/{ios_src}"
        
        models_list.append({
            "id": model_id,
            "title": item["title"],
            "src": src,
            "ios_src": ios_src
        })
    
    return {"models": models_list, "count": len(models_list)}

class UploadResponse(BaseModel):
    success: bool
    message: str
    model_id: str | None = None
    model: ARResponse | None = None

@app.post("/api/upload", response_model=UploadResponse)
async def upload_model(
    glb_file: Annotated[UploadFile, File()],
    usdz_file: Annotated[UploadFile, File()],
    title: Annotated[str, Form()],
    model_id: Annotated[str | None, Form()] = None,
):
    """
    Upload a custom 3D model with both GLB and USDZ formats.
    
    Args:
        glb_file: GLB model file (required)
        usdz_file: USDZ model file (required)
        title: Model title/name (required)
        model_id: Custom unique identifier, or auto-generated if not provided
    """
    if model_id is None or model_id == "":
        model_id = uuid.uuid4().hex[:8]
    if MODEL_ID_PATTERN.fullmatch(model_id) is None:
        raise HTTPException(status_code=400, detail="Model ID must contain 1–64 letters, digits, underscores or hyphens")
    if model_id in models_db:
        raise HTTPException(status_code=400, detail="Model ID already exists")
    created_paths = []
    try:
        # Validate file extensions
        if not (glb_file.filename or "").endswith('.glb'):
            raise HTTPException(status_code=400, detail="GLB file must have .glb extension")
        
        if not (usdz_file.filename or "").endswith('.usdz'):
            raise HTTPException(status_code=400, detail="USDZ file must have .usdz extension")
        
        # Validate title
        if not title or len(title.strip()) == 0:
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        
        # Read file contents for validation
        glb_content = await read_model_file(glb_file)
        usdz_content = await read_model_file(usdz_file)
        
        # Validate file contents
        if not validate_model_file(glb_file.filename, glb_content):
            raise HTTPException(status_code=400, detail="Invalid GLB file format")
        
        if not validate_model_file(usdz_file.filename, usdz_content):
            raise HTTPException(status_code=400, detail="Invalid USDZ file format")
        
        # Another upload may have completed while file reads yielded control.
        if model_id in models_db:
            raise HTTPException(status_code=400, detail="Model ID already exists")
        
        # Generate file names with model_id
        glb_filename = f"{model_id}.glb"
        usdz_filename = f"{model_id}.usdz"
        
        # Save files to static directory
        glb_path = Path("static") / glb_filename
        usdz_path = Path("static") / usdz_filename
        
        # Exclusive creation also refuses existing files and symbolic links.
        for path, content in ((glb_path, glb_content), (usdz_path, usdz_content)):
            with path.open('xb') as stream:
                created_paths.append(path)
                stream.write(content)
        
        # Add to models database
        item = {
            "title": title.strip(),
            "src": glb_filename,
            "ios_src": usdz_filename
        }
        
        # Save database to file
        save_models_db({**models_db, model_id: item})
        models_db[model_id] = item
        
        # Build response with full URLs
        return {
            "success": True,
            "message": f"Model '{title}' uploaded successfully with ID '{model_id}'",
            "model_id": model_id,
            "model": {
                "title": title.strip(),
                "src": f"{BASE_URL}/static/{glb_filename}",
                "ios_src": f"{BASE_URL}/static/{usdz_filename}"
            }
        }
    
    except BaseException as exc:
        # Only remove assets created by this attempt, never pre-existing files.
        for path in created_paths:
            try:
                path.unlink(missing_ok=True)
            except OSError:
                logger.exception("Could not clean up an incomplete upload")
        if isinstance(exc, HTTPException):
            raise
        if isinstance(exc, FileExistsError):
            raise HTTPException(status_code=409, detail="Model asset already exists") from None
        if not isinstance(exc, Exception):
            raise
        logger.exception("Model upload failed")
        raise HTTPException(status_code=500, detail="Upload could not be saved") from None

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
