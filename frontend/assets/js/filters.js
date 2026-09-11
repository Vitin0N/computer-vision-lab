import { initTheme } from './shared/theme.js';
import { sendImage } from './shared/api.js';

// Inicializa o modo escuro/claro
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
let videoStream = null;
let frameInterval = null; // Gerencia o intervalo de processamento contínuo (opcional)

// Sliders numéricos
p1.oninput = () => (val1.innerText = p1.value);
p2.oninput = () => (val2.innerText = p2.value);

// Troca de sub-filtro na barra lateral
document.querySelectorAll('.subfilter-btn').forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll('.subfilter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentOperation = btn.dataset.op;
  };
});

// Carregamento da imagem ou vídeo local
fileUpload.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  stopWebcam(); // Desliga a câmera se estiver em uso

  selectedFile = file;
  const fileUrl = URL.createObjectURL(file);

  // Limpa intervalos de captura ativos
  if (frameInterval) clearInterval(frameInterval);

  // Verifica se é vídeo
  if (file.type.startsWith('video/')) {
    videoElement.srcObject = null;
    videoElement.src = fileUrl;
    videoElement.controls = true;
    videoElement.style.display = 'block';

    previewOriginal.style.display = 'none';
    placeholderInput.style.display = 'none';

    // Dispara a captura contínua apenas enquanto o vídeo toca (descomente para usar)
    videoElement.onplay = () => {
      // frameInterval = setInterval(processCurrentFrame, 1000); 
    };
    videoElement.onpause = () => clearInterval(frameInterval);
    videoElement.onended = () => clearInterval(frameInterval);

  } 
  // Verifica se é imagem
  else if (file.type.startsWith('image/')) {
    videoElement.pause();
    videoElement.style.display = 'none';

    previewOriginal.src = fileUrl;
    previewOriginal.style.display = 'block';
    placeholderInput.style.display = 'none';
  }
};

// Processamento via OpenCV (Manual via botão)
btnExecute.onclick = async () => {
  await processCurrentFrame();
};

// Lógica de processamento isolada para ser reutilizável
async function processCurrentFrame() {
  // Verifica se a origem é um vídeo em execução (Webcam ou Arquivo local)
  const isVideoSource = videoStream || (selectedFile && selectedFile.type.startsWith('video/'));
  
  // Se for vídeo, "tira um print". Se for imagem, usa o arquivo original.
  const fileToProcess = isVideoSource ? await captureCurrentFrame() : selectedFile;

  if (!fileToProcess) return alert('Selecione uma imagem, vídeo ou ative a câmera primeiro!');

  const t0 = performance.now();
  latencyBadge.innerText = 'Processando...';

  try {
    // Envia para o back-end usando a função já existente no seu api.js
    const outputUrl = await sendImage(fileToProcess, currentOperation, p1.value, p2.value);
    
    previewResult.src = outputUrl;
    previewResult.style.display = 'block';
    previewResult.previousElementSibling.style.display = 'none';

    // Habilita download
    btnDownload.href = outputUrl;
    btnDownload.style.display = 'inline-block';

    const duration = Math.round(performance.now() - t0);
    latencyBadge.innerText = `${duration}ms`;
  } catch (err) {
    latencyBadge.innerText = 'Erro';
    alert(err.message);
  }
}

// Lógica da Webcam
btnWebcam.onclick = async () => {
  if (videoStream) {
    stopWebcam();
    return;
  }

  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('A câmera não está disponível neste navegador ou contexto.');
    }

    videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    videoElement.srcObject = videoStream;
    videoElement.src = ""; // Limpa vídeos locais caso existam
    videoElement.controls = false; // Tira os controles nativos para a webcam
    videoElement.style.display = 'block';
    
    previewOriginal.style.display = 'none';
    placeholderInput.style.display = 'none';
    
    btnWebcam.innerText = 'Desativar Câmera';
    
    // Inicia captura contínua da webcam (descomente para usar)
    // frameInterval = setInterval(processCurrentFrame, 1000);

  } catch (err) {
    stopWebcam();
    alert(`Erro ao acessar a câmera: ${err.message}`);
  }
};

// Para a webcam de forma segura
function stopWebcam() {
  if (frameInterval) clearInterval(frameInterval);

  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoStream = null;
  }
  
  videoElement.srcObject = null;
  videoElement.style.display = 'none';
  btnWebcam.disabled = false;
  btnWebcam.innerText = 'Usar Câmera';

  // Restaura a visualização anterior dependendo do arquivo selecionado
  if (selectedFile && selectedFile.type.startsWith('image/')) {
    previewOriginal.style.display = 'block';
    placeholderInput.style.display = 'none';
  } else if (selectedFile && selectedFile.type.startsWith('video/')) {
    videoElement.style.display = 'block';
    placeholderInput.style.display = 'none';
  } else {
    previewOriginal.style.display = 'none';
    placeholderInput.style.display = 'block';
  }
}

// Captura do Canvas
function captureCurrentFrame() {
  // Removida a obrigatoriedade do videoStream. Assim ele captura frames de vídeos locais também.
  if (!videoElement.videoWidth) return null; 

  const context = canvasElement.getContext('2d');
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

  return new Promise((resolve) => {
    canvasElement.toBlob((blob) => {
      resolve(blob ? new File([blob], 'frame.jpg', { type: 'image/jpeg' }) : null);
    }, 'image/jpeg', 0.8);
  });
}