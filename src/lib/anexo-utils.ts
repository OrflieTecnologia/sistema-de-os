import { comprimirImagem } from './image-utils'
import { tipoAnexoPermitido, mimeDeDataUrl } from './anexo-tipos'

export const MAX_ANEXO_BYTES = 5 * 1024 * 1024 // 5MB por documento

export function ehImagem(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/')
}

function lerComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}

/**
 * Processa um arquivo escolhido pelo usuário em { dados (data URL base64), nome }.
 * Imagens são redimensionadas/comprimidas; documentos são lidos direto (com limite de tamanho).
 * Lança erro com mensagem amigável se o tipo não for permitido ou exceder o limite.
 */
export async function processarArquivo(file: File): Promise<{ dados: string; nome: string }> {
  if (!tipoAnexoPermitido(file.type || '')) {
    throw new Error(`"${file.name}": tipo de arquivo não permitido.`)
  }
  if (file.type.startsWith('image/')) {
    const dados = await comprimirImagem(file)
    return { dados, nome: file.name }
  }
  if (file.size > MAX_ANEXO_BYTES) {
    throw new Error(`"${file.name}" excede o limite de 5MB.`)
  }
  const dados = await lerComoDataUrl(file)
  return { dados, nome: file.name }
}

/** Tamanho aproximado do arquivo a partir do base64. */
export function formatarTamanhoDataUrl(dataUrl: string): string {
  const b64 = dataUrl.split(',')[1] || ''
  const bytes = Math.floor((b64.length * 3) / 4)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Rótulo curto do tipo (ex.: PDF, Excel, Word) a partir do nome/mime. */
export function rotuloArquivo(nome?: string | null, dataUrl?: string): string {
  const ext = (nome?.split('.').pop() || '').toLowerCase()
  const mime = dataUrl ? mimeDeDataUrl(dataUrl) : ''
  if (ext === 'pdf' || mime.includes('pdf')) return 'PDF'
  if (['xls', 'xlsx', 'csv'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel')) return 'Excel'
  if (['doc', 'docx'].includes(ext) || mime.includes('word')) return 'Word'
  if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) return 'PowerPoint'
  if (ext === 'txt' || mime === 'text/plain') return 'Texto'
  if (ext === 'zip' || mime.includes('zip')) return 'ZIP'
  return ext ? ext.toUpperCase() : 'Arquivo'
}

/** Abre o anexo numa nova aba via blob URL (PDF abre no visualizador; office baixa). */
export function abrirAnexo(dataUrl: string): void {
  try {
    const [meta, b64] = dataUrl.split(',')
    const mime = mimeDeDataUrl(meta) || 'application/octet-stream'
    const bin = atob(b64)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    const blob = new Blob([arr], { type: mime })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch {
    /* ignore */
  }
}
