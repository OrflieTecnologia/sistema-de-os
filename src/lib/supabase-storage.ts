import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { mimeDeDataUrl } from './anexo-tipos'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY
export const BUCKET_ANEXOS = process.env.SUPABASE_STORAGE_BUCKET || 'anexos-os'

/** Indica se o Storage está configurado (env presentes). */
export function storageConfigurado(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY)
}

let _client: ReturnType<typeof createClient> | null = null
function admin() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('Supabase Storage não configurado (SUPABASE_URL / SERVICE_ROLE_KEY).')
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _client
}

const EXT_POR_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/rtf': 'rtf',
  'application/zip': 'zip',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

function extensaoDe(nome: string | null | undefined, mime: string): string {
  const doNome = (nome?.split('.').pop() || '').toLowerCase()
  if (doNome && doNome.length <= 5) return doNome
  return EXT_POR_MIME[mime] || 'bin'
}

function idAleatorio(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

/**
 * Faz upload de um anexo (data URL base64) para o Storage.
 * Retorna o caminho salvo dentro do bucket (a guardar em AnexoOS.storagePath).
 */
export async function uploadAnexoDataUrl(
  dataUrl: string,
  ordemId: string,
  nome?: string | null,
): Promise<string> {
  const virgula = dataUrl.indexOf(',')
  const b64 = virgula >= 0 ? dataUrl.slice(virgula + 1) : dataUrl
  const mime = mimeDeDataUrl(dataUrl) || 'application/octet-stream'
  const buffer = Buffer.from(b64, 'base64')
  const ext = extensaoDe(nome, mime)
  const path = `${ordemId}/${idAleatorio()}.${ext}`

  const { error } = await admin()
    .storage.from(BUCKET_ANEXOS)
    .upload(path, buffer, { contentType: mime, upsert: false })

  if (error) {
    throw new Error(`Falha ao enviar anexo ao Storage: ${error.message}`)
  }
  return path
}

/** Gera uma URL assinada temporária para leitura de um anexo. */
export async function urlAssinada(path: string, expiraEmSegundos = 3600): Promise<string | null> {
  const { data, error } = await admin()
    .storage.from(BUCKET_ANEXOS)
    .createSignedUrl(path, expiraEmSegundos)
  if (error || !data) return null
  return data.signedUrl
}

/** Remove um anexo do Storage (silencioso em caso de erro). */
export async function removerAnexoStorage(path: string): Promise<void> {
  try {
    await admin().storage.from(BUCKET_ANEXOS).remove([path])
  } catch {
    /* ignore */
  }
}
