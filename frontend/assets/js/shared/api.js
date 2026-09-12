export async function sendImage(file, operation, p1 = 100, p2 = 200) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('operation', operation);
  formData.append('p1', p1);
  formData.append('p2', p2);

  const res = await fetch('/api/process', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Erro ao processar imagem no servidor');

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

let ws = null;

export function sendVideoState(state) {
  if(ws && ws.readyState == WebSocket.OPEN) {
    ws.send(JSON.stringify(state)); // Dispara as novas configurações para o back
  }
}

export function initVideoWebSocket(onFrameReceived) {
  // Evita abrir muitas conexões
  if (ws && ws.readyState == WebSocket.OPEN) return;

  const protocol = window.location.protocol == 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/api/ws/process`;

  // Cria um novo WebSocket
  ws = new WebSocket(wsUrl);
  ws.binaryType = 'blob';

  ws.onopen = () => console.log('Tunel websocket aberto');

  ws.onmessage = (event) => {
    if ((event.data instanceof Blob)) {
      const url = URL.createObjectURL(event.data)
      onFrameReceived(url);
    }
  };

  ws.onerror = (error) => console.error('Erro no WebSocket: ', error);
  ws.onclose = () => console.log('WebSocket fechado');
}


// Envia mensagem se o websocket estiver aberto
export function sendVideoFrame(data) {
  if(ws && ws.readyState == WebSocket.OPEN){
    ws.send(data);
    return true;
  }

  return false;
}

export function closeVideoWebSocket() {
  if (ws) {
    ws.close();
    ws = null;
  }
}

