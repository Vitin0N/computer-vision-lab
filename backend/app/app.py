from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="VisionLab API")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# Monta assets e pages para acesso direto via URL
app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")
app.mount("/pages", StaticFiles(directory=str(FRONTEND_DIR / "pages")), name="pages")

# Ao entrar na raiz, redireciona direto para o módulo inicial
@app.get("/")
def root():
    return FileResponse(FRONTEND_DIR / "index.html")