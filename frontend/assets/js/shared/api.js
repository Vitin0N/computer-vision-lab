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