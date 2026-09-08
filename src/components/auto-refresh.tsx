'use client'

import { useRouter } from 'next/navigation'
import { useAutoRefresh } from '@/lib/use-auto-refresh'

/**
 * Atualiza os dados das Server Components da página automaticamente
 * (ao focar a aba + a cada `intervalMs`), sem recarregar a página inteira.
 * Não renderiza nada visível.
 */
export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter()
  useAutoRefresh(() => router.refresh(), intervalMs)
  return null
}
