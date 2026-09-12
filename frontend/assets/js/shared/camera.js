import { initVideoWebSocket, sendVideoFrame, closeVideoWebSocket } from './api.js';

let videoEl = null;
let canvasEl = null;
let videoStream = null;
let isVideoPlaying = false;
let isProcessing = false;

// Conecta os elementos do HTML ao nosso "motor"
export function initCameraEnvironment(videoElement, canvasElement) {
  videoEl = videoElement;
  canvasEl = canvasElement;
}

// Liga a webcam
export async function startWebcam() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Câmera indisponível neste navegador.');
  }
  videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoEl.srcObject = videoStream;
  videoEl.src = "";
  videoEl.controls = false;
  return videoStream;
}

// Desliga a webcam de forma segura
export function stopWebcam() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  videoEl.srcObject = null;
  stopVideoProcessing();
}

// Inicia o fluxo Ping-Pong (Video ou Webcam)
export function startVideoProcessing(onFrameReceivedCallback) {
  isVideoPlaying = true;
  isProcessing = false;

  initVideoWebSocket((processedUrl) => {
    // Envia a imagem final
    onFrameReceivedCallback(processedUrl);
    
    // Libera a trava e pede o PRÓXIMO frame sincronizado com o monitor
    isProcessing = false;
    if (isVideoPlaying) {
      requestAnimationFrame(processNextFrame);
    }
  });

  // Dá o pontapé inicial
  requestAnimationFrame(processNextFrame);
}

// Interrompe o Loop
export function stopVideoProcessing() {
  isVideoPlaying = false;
  closeVideoWebSocket();
}

// Função isolada de extração de frame no Canvas (Uso interno do módulo)
function processNextFrame() {
  if (!isVideoPlaying || isProcessing) return;

  if (!videoEl.videoWidth) {
    requestAnimationFrame(processNextFrame);
    return;
  }

  isProcessing = true;
  const context = canvasEl.getContext('2d');
  canvasEl.width = videoEl.videoWidth;
  canvasEl.height = videoEl.videoHeight;
  context.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

  // Converte direto para binário otimizado (ignora a leitura da UI aqui)
  canvasEl.toBlob((blob) => {
    if (blob) {
      const sent = sendVideoFrame(blob);
      if (!sent) isProcessing = false;
    } else {
      isProcessing = false;
    }
  }, 'image/jpeg', 0.6);
}