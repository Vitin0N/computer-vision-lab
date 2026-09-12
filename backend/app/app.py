from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import RedirectResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles

import base64
import json
import asyncio
import cv2
import numpy as np

from backend.app.service.image_filter import apply_filter

def process_cv2_sync(state, img_bytes):
    np_img = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    
    if img is None:
        return None
        
    processed_img = apply_filter(
        img, state['operation'], state['p1'], state['p2'], state['p3']
    )
    if processed_img is None:
        processed_img = img
        
    success, encoded_img = cv2.imencode('.jpg', processed_img, [cv2.IMWRITE_JPEG_QUALITY, 60])
    return encoded_img.tobytes() if success else None


app = FastAPI(title="Computer Vision Lab API")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

@app.websocket('/api/ws/process')
async def websocket_process(websocket: WebSocket):
    await websocket.accept()
    current_state = {"operation": "cinza", "p1": None, "p2": None, "p3": None}

    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break

            if 'text' in message:
                current_state.update(json.loads(message['text']))

            elif 'bytes' in message:
                # O asyncio.to_thread libera o servidor para ouvir a troca de filtros instantaneamente
                encoded_bytes = await asyncio.to_thread(
                    process_cv2_sync, current_state.copy(), message['bytes']
                )
                
                if encoded_bytes:
                    await websocket.send_bytes(encoded_bytes)
                else:
                    await websocket.send_text('erro_decodificacao')
                    
    except WebSocketDisconnect:
        print('Cliente desconectado via exceção')

@app.post('/api/process')
async def process_frame(
    file: UploadFile = File(...),
    operation: str = Form(...),
    p1: str = Form(None),
    p2: str = Form(None),
    p3: str = Form(None)
):
    image_bytes = await file.read()
    print(f'Recebido {file.filename} | Operação {operation} | p1 {p1} | p2 {p2}')

    # Transforma a imagem recebida do front para padrão 'cv2'
    np_img = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if img is None:
        return Response(content='Erro ao decodificar a imagem', status_code=400)

    processed_img = apply_filter(img, operation, p1, p2, p3)

    success, encoded_img = cv2.imencode('.jpg', processed_img, [cv2.IMWRITE_JPEG_QUALITY, 85])

    if not success:
        return Response(content="Erro ao codificar a imagem", status_code=500)

    # Transformando a imagem em bytes para enviar para o front
    result_bytes = encoded_img.tobytes()
    return Response(content=result_bytes, media_type='image/jpeg')    

# Ao entrar na raiz, redireciona direto para o módulo inicial
@app.get("/")
def root():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get('/pages/filters')
def page_filter():
    return FileResponse(FRONTEND_DIR / 'pages/filters.html')

# Monta assets e pages para acesso direto via URL
app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")
app.mount("/pages", StaticFiles(directory=str(FRONTEND_DIR / "pages")), name="pages")