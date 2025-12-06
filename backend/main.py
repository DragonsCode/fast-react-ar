from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os

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

# === НАСТРОЙКИ ===
# Сюда вставьте ваш текущий домен Ngrok (без слеша в конце)
# Если используете локально, оставьте http://localhost:8000
BASE_URL = "https://elidible-ralline-conor.ngrok-free.dev" 

# База данных
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
        # Эта ссылка 100% рабочая и разрешает CORS
        "src": "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
        "ios_src": "https://modelviewer.dev/shared-assets/models/Astronaut.usdz"
    },
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)