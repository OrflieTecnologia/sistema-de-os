// Utilitário de compressão/redimensionamento de imagens no cliente.
// Reduz o print para no máximo `maxDim` px no maior lado e converte para JPEG,
// gerando uma data URL base64 leve para armazenar no banco.
export async function comprimirImagem(
  file: File,
  maxDim = 1280,
  quality = 0.8
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('Falha ao carregar a imagem'))
    i.src = dataUrl
  })

  let { width, height } = img
  if (width > maxDim || height > maxDim) {
    const scale = Math.min(maxDim / width, maxDim / height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl

  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}
