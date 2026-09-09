// Tipos de anexo permitidos (imagens + documentos comuns).
// Módulo puro (sem APIs de browser) — usado no cliente e no servidor.

export const TIPOS_ANEXO_PERMITIDOS: string[] = [
  'image/', // qualquer imagem
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain', // .txt
  'text/csv', // .csv
  'application/rtf',
  'application/zip',
]

export function mimeDeDataUrl(dataUrl: string): string {
  const m = /^data:([^;,]+)[;,]/.exec(dataUrl)
  return m ? m[1] : ''
}

export function tipoAnexoPermitido(mime: string): boolean {
  if (!mime) return false
  return TIPOS_ANEXO_PERMITIDOS.some((t) => (t.endsWith('/') ? mime.startsWith(t) : mime === t))
}

const EXTENSOES_IMAGEM = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif']

/** Detecta se um nome/caminho de arquivo é imagem pela extensão. */
export function ehImagemPorExtensao(nomeOuPath?: string | null): boolean {
  const ext = (nomeOuPath?.split('.').pop() || '').toLowerCase()
  return EXTENSOES_IMAGEM.includes(ext)
}
