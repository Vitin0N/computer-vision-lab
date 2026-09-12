export async function sendImage(file, operation, p1 = 100, p2 = 200, p3 = null) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('operation', operation);
  formData.append('p1', p1);
  formData.append('p2', p2);
  formData.append('p3', p3);

  const res = await fetch('/api/process', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Erro ao processar imagem no servidor');

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

let ws = null;
let pendingVideoState = null;

export function sendVideoState(state) {
  pendingVideoState = state;

  if(ws && ws.readyState == WebSocket.OPEN) {
    ws.send(JSON.stringify(pendingVideoState)); // Dispara as novas configurações para o back
    pendingVideoState = null;
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

  ws.onopen = () => {
    console.log('Tunel websocket aberto');

    if (pendingVideoState) {
      ws.send(JSON.stringify(pendingVideoState));
      pendingVideoState = null;
    }
  };

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

