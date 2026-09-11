from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import RedirectResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="VisionLab API")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# Monta assets e pages para acesso direto via URL
app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")
app.mount("/pages", StaticFiles(directory=str(FRONTEND_DIR / "pages")), name="pages")

@app.post('/api/process')
async def process_frame(
    file: UploadFile = File(...),
    operation: str = Form(...),
    p1: str = Form(...),
    p2: str = Form(...)
):
    image_bytes = await file.read()

    print(f'Recebido {file.filename} | Operação {operation} | p1 {p1} | p2 {p2}')

    # TODO: Adicionar o processamento da imagem aqui

    return Response(content=image_bytes, media_type='image/jpeg')
    

# Ao entrar na raiz, redireciona direto para o módulo inicial
@app.get("/")
def root():
    return FileResponse(FRONTEND_DIR / "index.html")