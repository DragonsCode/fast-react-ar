from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import uuid
import json
from pathlib import Path

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
        with open(MODELS_DB_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_models_db(db):
    """Save models to JSON file"""
    with open(MODELS_DB_FILE, 'w') as f:
        json.dump(db, f, indent=2)

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

class UploadResponse(BaseModel):
    success: bool
    message: str
    model_id: str = None
    model: ARResponse = None

@app.post("/api/upload", response_model=UploadResponse)
async def upload_model(
    glb_file: UploadFile = File(...),
    usdz_file: UploadFile = File(...),
    title: str = Form(...),
    model_id: str = Form(default=None)
):
    """
    Upload a custom 3D model with both GLB and USDZ formats.
    
    Args:
        glb_file: GLB model file (required)
        usdz_file: USDZ model file (required)
        title: Model title/name (required)
        model_id: Custom unique identifier, or auto-generated if not provided
    """
    try:
        # Validate file extensions
        if not glb_file.filename.endswith('.glb'):
            raise HTTPException(status_code=400, detail="GLB file must have .glb extension")
        
        if not usdz_file.filename.endswith('.usdz'):
            raise HTTPException(status_code=400, detail="USDZ file must have .usdz extension")
        
        # Validate title
        if not title or len(title.strip()) == 0:
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        
        # Read file contents for validation
        glb_content = await glb_file.read()
        usdz_content = await usdz_file.read()
        
        # Validate file contents
        if not validate_model_file(glb_file.filename, glb_content):
            raise HTTPException(status_code=400, detail="Invalid GLB file format")
        
        if not validate_model_file(usdz_file.filename, usdz_content):
            raise HTTPException(status_code=400, detail="Invalid USDZ file format")
        
        # Generate or validate model ID
        if not model_id:
            model_id = str(uuid.uuid4())[:8]  # Generate 8-character unique ID
        
        # Check if model_id already exists
        if model_id in models_db:
            raise HTTPException(status_code=400, detail=f"Model with ID '{model_id}' already exists")
        
        # Generate file names with model_id
        glb_filename = f"{model_id}.glb"
        usdz_filename = f"{model_id}.usdz"
        
        # Save files to static directory
        glb_path = Path("static") / glb_filename
        usdz_path = Path("static") / usdz_filename
        
        with open(glb_path, 'wb') as f:
            f.write(glb_content)
        
        with open(usdz_path, 'wb') as f:
            f.write(usdz_content)
        
        # Add to models database
        models_db[model_id] = {
            "title": title.strip(),
            "src": glb_filename,
            "ios_src": usdz_filename
        }
        
        # Save database to file
        save_models_db(models_db)
        
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
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)