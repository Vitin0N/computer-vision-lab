import { initTheme } from './shared/theme.js';
import { sendImage } from './shared/api.js';

// Inicializa o modo escuro/claro
initTheme();

const fileUpload = document.getElementById('fileUpload');
const previewOriginal = document.getElementById('previewOriginal');
const previewResult = document.getElementById('previewResult');
const btnExecute = document.getElementById('btnExecute');
const btnDownload = document.getElementById('btnDownload');
const latencyBadge = document.getElementById('latencyBadge');
const p1 = document.getElementById('p1');
const p2 = document.getElementById('p2');
const val1 = document.getElementById('val1');
const val2 = document.getElementById('val2');

let selectedFile = null;
let currentOperation = 'canny';

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

// Carregamento da imagem local
fileUpload.onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile = file;
    previewOriginal.src = URL.createObjectURL(file);
    previewOriginal.style.display = 'block';
    previewOriginal.previousElementSibling.style.display = 'none';
  }
};

// Processamento via OpenCV
btnExecute.onclick = async () => {
  if (!selectedFile) return alert('Selecione uma imagem primeiro!');

  const t0 = performance.now();
  latencyBadge.innerText = 'Processando...';

  try {
    const outputUrl = await sendImage(selectedFile, currentOperation, p1.value, p2.value);
    
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
};