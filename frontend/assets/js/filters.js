import { initTheme } from './shared/theme.js';
import { sendImage } from './shared/api.js';
import { initCameraEnvironment, startWebcam, stopWebcam, startVideoProcessing, stopVideoProcessing } from './shared/camera.js';

initTheme();

const fileUpload = document.getElementById('fileUpload');
const previewOriginal = document.getElementById('previewOriginal');
const previewResult = document.getElementById('previewResult');
const btnExecute = document.getElementById('btnExecute');
const btnDownload = document.getElementById('btnDownload');
const btnWebcam = document.getElementById('btnWebcam');
const latencyBadge = document.getElementById('latencyBadge');
const p1 = document.getElementById('p1');
const p2 = document.getElementById('p2');
const val1 = document.getElementById('val1');
const val2 = document.getElementById('val2');
const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');
const placeholderInput = previewOriginal.previousElementSibling;

let selectedFile = null;
let currentOperation = 'canny';
let isVideoMode = false;

// Apresenta os elementos HTML ao motor de câmera
initCameraEnvironment(videoElement, canvasElement);

// --- MANIPULAÇÃO DE INTERFACE E FILTROS ---
p1.oninput = () => { val1.innerText = p1.value; if(!isVideoMode && selectedFile) processStaticImage(); };
p2.oninput = () => { val2.innerText = p2.value; if(!isVideoMode && selectedFile) processStaticImage(); };

document.querySelectorAll('.subfilter-btn').forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll('.subfilter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentOperation = btn.dataset.op;
    if(!isVideoMode && selectedFile) processStaticImage();
  };
});

// --- UPLOAD DE ARQUIVOS (FÍSICOS) ---
fileUpload.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  stopWebcam();
  selectedFile = file;
  const fileUrl = URL.createObjectURL(file);

  if (file.type.startsWith('video/')) {
    isVideoMode = true;
    btnExecute.disabled = true;

    videoElement.src = fileUrl;
    videoElement.controls = true;
    videoElement.style.display = 'block';
    previewOriginal.style.display = 'none';
    placeholderInput.style.display = 'none';

    videoElement.onplay = () => startVideoProcessing(updateResultUI);
    videoElement.onpause = () => stopVideoProcessing();
    videoElement.onended = () => stopVideoProcessing();

  } else if (file.type.startsWith('image/')) {
    isVideoMode = false;
    btnExecute.disabled = false;
    
    videoElement.pause();
    videoElement.style.display = 'none';
    previewOriginal.src = fileUrl;
    previewOriginal.style.display = 'block';
    placeholderInput.style.display = 'none';

    processStaticImage();
  }
};

// --- PROCESSAMENTO DE IMAGENS ESTÁTICAS ---
btnExecute.onclick = async () => {
  if (isVideoMode || !previewResult.src) return;
  
  previewOriginal.src = previewResult.src;
  try {
    const res = await fetch(previewResult.src);
    const blob = await res.blob();
    selectedFile = new File([blob], 'processada.jpg', {type: 'image/jpeg'});
    processStaticImage();
  } catch (err) {
    console.error('Erro ao converter imagem:', err);
  }
};

async function processStaticImage() {
  if (!selectedFile) return;
  const t0 = performance.now();
  latencyBadge.innerText = 'Processando...';

  try {
    const outputUrl = await sendImage(selectedFile, currentOperation, p1.value, p2.value);
    updateResultUI(outputUrl);
    
    const duration = Math.round(performance.now() - t0);
    latencyBadge.innerText = `${duration}ms`;
  } catch (err) {
    latencyBadge.innerText = 'Erro';
    alert(err.message);
  }
}

// --- WEBCAM ---
btnWebcam.onclick = async () => {
  if (isVideoMode && videoElement.srcObject) {
    stopWebcam();
    restoreUI();
    return;
  }

  try {
    await startWebcam();
    isVideoMode = true;
    btnExecute.disabled = true;
    
    videoElement.style.display = 'block';
    previewOriginal.style.display = 'none';
    placeholderInput.style.display = 'none';
    btnWebcam.innerText = 'Desativar Câmera';

    // Dispara o processador passando a função que pinta a tela como callback
    startVideoProcessing(updateResultUI);
  } catch (err) {
    alert(`Erro de hardware: ${err.message}`);
  }
};

// --- HELPERS VISUAIS ---
function updateResultUI(processedUrl) {
  if (!processedUrl) return;

  if (previewResult.src.startsWith('blob:')) {
    URL.revokeObjectURL(previewResult.src);
  }
  
  previewResult.src = processedUrl;
  previewResult.style.display = 'block';
  previewResult.previousElementSibling.style.display = 'none';
  
  btnDownload.href = processedUrl;
  btnDownload.style.display = 'inline-block';
}

function restoreUI() {
  btnWebcam.disabled = false;
  btnWebcam.innerText = 'Usar Câmera';
  
  if (selectedFile?.type.startsWith('image/')) {
    isVideoMode = false;
    btnExecute.disabled = false;
    previewOriginal.style.display = 'block';
  } else if (selectedFile?.type.startsWith('video/')) {
    isVideoMode = true;
    videoElement.style.display = 'block';
  } else {
    isVideoMode = false;
    videoElement.style.display = 'none';
    placeholderInput.style.display = 'block';
  }
}