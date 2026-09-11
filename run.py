# No final do backend/app/app.py
import uvicorn

if __name__ == "__main__":
    # Inicia o uvicorn programaticamente
    uvicorn.run("backend.app.app:app", host="127.0.0.1", port=8000, reload=True)