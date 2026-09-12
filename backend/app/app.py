from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import RedirectResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles

import cv2
import numpy as np

app = FastAPI(title="VisionLab API")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# Monta assets e pages para acesso direto via URL
app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")
app.mount("/pages", StaticFiles(directory=str(FRONTEND_DIR / "pages")), name="pages")

@app.websocket('/api/ws/process')
async def websocket_process(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Recebe a imagem em bytes
            imagem_bytes = await websocket.receive_bytes()

            # Decodifica, processa e codifica
            np_img = np.frombuffer(imagem_bytes, np.uint8)
            img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

            if img is not None:
                bordas = cv2.Canny(img, 50, 190)
                success, encoded_img = cv2.imencode('.jpg', bordas, [cv2.IMWRITE_JPEG_QUALITY, 70])

                if success:
                    await websocket.send_bytes(encoded_img.tobytes())

            else:
                await websocket.send_text('erro_decodifacacao')

    except WebSocketDisconnect:
        print('Cliente desconectado')


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

    np_img = np.frombuffer(image_bytes, np.uint8)

    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if img is None:
        return Response(content='Erro ao decodificar a imagem', status_code=400)

    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    success, encoded_img = cv2.imencode('.jpg', img_gray)

    if not success:
        return Response(content="Erro ao codificar a imagem", status_code=500)

    result_bytes = encoded_img.tobytes()

    return Response(content=result_bytes, media_type='image/jpeg')    

# Ao entrar na raiz, redireciona direto para o módulo inicial
@app.get("/")
def root():
    return FileResponse(FRONTEND_DIR / "index.html")