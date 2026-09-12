import { initTheme } from './shared/theme.js';
import { sendImage, sendVideoState } from './shared/api.js';
import { initCameraEnvironment, startWebcam, stopWebcam, startVideoProcessing, stopVideoProcessing } from './shared/camera.js';

initTheme();

const fileUpload = document.getElementById('fileUpload');
const previewOriginal = document.getElementById('previewOriginal');
const previewResult = document.getElementById('previewResult');
const btnExecute = document.getElementById('btnExecute');
const btnDownload = document.getElementById('btnDownload');
const btnWebcam = document.getElementById('btnWebcam');
const latencyBadge = document.getElementById('latencyBadge');
const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');
const placeholderInput = previewOriginal.previousElementSibling;
const paramsDinamicosInput = document.getElementById('dynamicParamsContainer')

let selectedFile = null;
let currentOperation = 'cinza';
let isVideoMode = false;

let timerEnvio;

// --- CONFIGURAÇÕES DE PARAMETROS PARA CADA OPERAÇÃO ---
const filtersConfig = {
  'negativo': [],
  'cinza': [],
  'threshold': [
    {id: 'p1', type: 'range', label: 'limiar de corte', min: 0, max: 255, value: 127}
  ],
  'log': [
    {id: 'p1', type: 'range', label: 'c', min: 0.1, max: 3, value: 1.5, step:0.1}
  ],
  'potencia': [
    {id: 'p1', type: 'range', label: 'gamma', min: 0.1, max: 3, value: 1.5, step: 0.1},

  ],
  'equalizar': [],
  'fat-intensidade': [
    {id: 'p1', type: 'range', label: 'low', min: 0, max: 255, value: 127},
    {id: 'p2', type: 'range', label: 'upper', min: 0, max: 255, value: 255},
    {id: 'p3', type: 'checkbox', label: 'preservar fundo', checked: true}
  ],
  'blur-gaussiano': [
    {id: 'p1', type: 'range', label: 'Sigma', min: 1, max: 70, value: 5}
  ],
  'media': [
    {id: 'p1', type: 'range', label: 'Sigma', min: 1, max: 70, value: 5}
  ], 
  'mediana': [
    {id: 'p1', type: 'range', label: 'Sigma', min: 1, max: 70, value: 5}
  ],
  'max': [
    {id: 'p1', type: 'range', label: 'Sigma', min: 0, max: 255, value: 5}
  ],
  'min': [
    {id: 'p1', type: 'range', label: 'Sigma', min: 0, max: 255, value: 5}
  ]
  // TODO: fazer os restos dos filtros
}

// Apresenta os elementos HTML ao motor de câmera
initCameraEnvironment(videoElement, canvasElement);

  
document.querySelectorAll('.subfilter-btn').forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll('.subfilter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentOperation = btn.dataset.op;
    renderParams(currentOperation);

    if(!isVideoMode && selectedFile) processStaticImage();
    else if (isVideoMode) pushStateToServer();
  };
});

// Renderiza os parametros pela primeira vez
renderParams(currentOperation);

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

    videoElement.play();

    videoElement.onplay = () => {
      startVideoProcessing(updateResultUI);
      pushStateToServer();
    };
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

  // Coleta parametros
  const p1El = document.getElementById('p1');
  const p1Value = p1El ? (p1El.type === 'checkbox' ? p1El.checked : p1El.value) : null;
  
  const p2El = document.getElementById('p2');
  const p2Value = p2El ? (p2El.type === 'checkbox' ? p2El.checked : p2El.value) : null;
  
  const p3El = document.getElementById('p3')
  const p3Value = p3El ? (p3El.type === 'checkbox' ? p3El.checked : p3El.value) : null;

  try {
    const outputUrl = await sendImage(selectedFile, currentOperation, p1Value, p2Value, p3Value);
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

    startVideoProcessing(updateResultUI);
    pushStateToServer(); 
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

function renderParams(operation){
  // Limpa o HTML antigo
  paramsDinamicosInput.innerHTML = '';

  // Procura as configurações dos filtros
  const params = filtersConfig[operation] || [];

  params.forEach(param => {
    const group = document.createElement('div');
    group.className = 'param-group';

    const label = document.createElement('label');
    label.innerHTML = `${param.label}: <span id="val_${param.id}">${param.value}</span>`;

    const input = document.createElement('input');
    input.type = param.type;
    input.id = param.id;

    if (param.type === 'range'){
      input.max = param.max;
      input.min = param.min;
      input.value = param.value;
      if (param.step) input.step = param.step;  

      // Atualiza o texto e processa a imagem com Debounce
      input.oninput = (e) => {
        document.getElementById(`val_${param.id}`).innerText = e.target.value;
        if (!isVideoMode && selectedFile) {
          clearTimeout(timerEnvio);
          timerEnvio = setTimeout(() => { processStaticImage(); }, 500); 
        } 
        else if (isVideoMode) {
          pushStateToServer();
        }
      };
    } else if (input.type === 'checkbox') {
      label.innerHTML = param.label;
      input.checked = param.checked;

      input.onchange = () =>{
        if (!isVideoMode && selectedFile){
          clearTimeout(timerEnvio);

          timerEnvio = setTimeout(() => {
            processStaticImage();
          }, 500); 
        } else if (isVideoMode) {
          pushStateToServer();
        }
      }
    }

    if (input.type === 'checkbox'){
      group.style.display = 'flex';
      group.style.flexDirection = 'row-reverse';
      group.style.alignItems = 'center';
      group.style.justifyContent = 'flex-end';
      group.appendChild(label);
      group.appendChild(input);
    } else {
      group.appendChild(label);
      group.appendChild(input);
    }

    paramsDinamicosInput.appendChild(group);
  });
}

function pushStateToServer() {
  if(!isVideoMode) return;

  const p1El = document.getElementById('p1');
  const p2El = document.getElementById('p2');
  const p3El = document.getElementById('p3');

  sendVideoState({
    operation: currentOperation,
    p1: p1El ? (p1El.type === 'checkbox' ? p1El.checked : p1El.value) : null,
    p2: p2El ? (p2El.type === 'checkbox' ? p2El.checked : p2El.value) : null,
    p3: p3El ? (p3El.type === 'checkbox' ? p3El.checked : p3El.value) : null
  });
}